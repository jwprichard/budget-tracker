#!/bin/bash
# EC2 User Data Script - Deploys Budget Tracker on first boot
# This script is templated by Terraform with all necessary variables
# NO SSH OR MANUAL STEPS REQUIRED!

# Log everything to file and console
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "========================================="
echo "Budget Tracker - EC2 Bootstrap"
echo "========================================="
echo "Started at: $(date)"

# Terraform-injected variables
export AWS_REGION="${aws_region}"
export AWS_ACCOUNT="${aws_account}"
export DATABASE_URL="${database_url}"
export BACKEND_IMAGE="${backend_image}"
export FRONTEND_IMAGE="${frontend_image}"

echo "AWS Region: $AWS_REGION"
echo "AWS Account: $AWS_ACCOUNT"
echo "Database URL: ${DATABASE_URL%%@*}@***"  # Hide password in logs

# ==========================================
# 0. Wait for IAM instance profile
# ==========================================
echo ""
echo "Step 0: Waiting for IAM credentials..."
MAX_WAIT=300  # 5 minutes
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✓ IAM credentials available!"
    aws sts get-caller-identity
    break
  fi
  echo "Waiting for IAM credentials... ($WAIT_COUNT s elapsed)"
  sleep 10
  WAIT_COUNT=$((WAIT_COUNT + 10))

  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "ERROR: Timeout waiting for IAM credentials"
    echo "Instance profile may not be attached properly"
    exit 1
  fi
done

# ==========================================
# 1. Install Docker and AWS CLI
# ==========================================
echo ""
echo "Step 1: Installing Docker and AWS CLI..."
yum update -y
yum install -y docker aws-cli
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Verify installations
docker --version
aws --version

# ==========================================
# 2. Login to ECR (using IAM role - no credentials!)
# ==========================================
echo ""
echo "Step 2: Logging into ECR..."
if aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com; then
  echo "✓ Successfully logged into ECR"
else
  echo "ERROR: Failed to login to ECR"
  echo "Check IAM role permissions and ECR repository existence"
  exit 1
fi

# ==========================================
# 3. Wait for images to be available in ECR
# ==========================================
echo ""
echo "Step 3: Waiting for images in ECR..."
echo "Backend image: $BACKEND_IMAGE"
echo "Frontend image: $FRONTEND_IMAGE"

# Function to check if image exists
check_image() {
  local image=$1
  local repo_name=$(echo $image | cut -d'/' -f2 | cut -d':' -f1)
  echo "  Checking repository: $repo_name"

  if aws ecr describe-images \
    --repository-name $repo_name \
    --image-ids imageTag=latest \
    --region $AWS_REGION \
    --output text > /dev/null 2>&1; then
    echo "  ✓ Found image in $repo_name"
    return 0
  else
    echo "  ✗ Image not found in $repo_name"
    return 1
  fi
}

# Wait up to 10 minutes for images
MAX_WAIT=600  # 10 minutes
WAIT_COUNT=0
WAIT_INTERVAL=30  # Check every 30 seconds

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  echo "Checking if images are available in ECR... ($($WAIT_COUNT / 60))min elapsed)"

  if check_image "$BACKEND_IMAGE" && check_image "$FRONTEND_IMAGE"; then
    echo "✓ Both images found in ECR!"
    break
  fi

  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "ERROR: Timeout waiting for images in ECR after $MAX_WAIT seconds"
    echo "This usually means GitHub Actions hasn't pushed the images yet."
    echo ""
    echo "You can check the GitHub Actions workflow at:"
    echo "https://github.com/YOUR_USERNAME/budget-tracker/actions"
    echo ""
    echo "To deploy manually later, SSH in and run: sudo /opt/deploy-app.sh"
    exit 1
  fi

  echo "Images not ready yet, sleeping $WAIT_INTERVAL seconds..."
  sleep $WAIT_INTERVAL
  WAIT_COUNT=$((WAIT_COUNT + WAIT_INTERVAL))
done

# ==========================================
# 4. Pull Docker Images
# ==========================================
echo ""
echo "Step 4: Pulling Docker images..."
echo "Pulling backend: $BACKEND_IMAGE"
if docker pull $BACKEND_IMAGE; then
  echo "✓ Backend image pulled successfully"
else
  echo "ERROR: Failed to pull backend image"
  exit 1
fi

echo "Pulling frontend: $FRONTEND_IMAGE"
if docker pull $FRONTEND_IMAGE; then
  echo "✓ Frontend image pulled successfully"
else
  echo "ERROR: Failed to pull frontend image"
  exit 1
fi

echo "✓ All images pulled successfully"
docker images | grep budget

# ==========================================
# 5. Start Backend Container
# ==========================================
echo ""
echo "Step 5: Starting backend container..."
docker run -d \
  --name budget-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  $BACKEND_IMAGE

# Wait for backend to be healthy
echo "Waiting for backend to be healthy..."
sleep 5

for i in {1..30}; do
  if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "WARNING: Backend health check failed after 30 attempts"
    echo "Backend logs:"
    docker logs budget-backend
  fi
  sleep 2
done

# ==========================================
# 6. Run Database Migrations
# ==========================================
echo ""
echo "Step 6: Running database migrations..."
docker exec budget-backend npx prisma migrate deploy || {
  echo "WARNING: Migration failed. This might be okay if migrations were already applied."
  echo "Migration logs:"
  docker logs budget-backend
}

# ==========================================
# 7. Start Frontend Container
# ==========================================
echo ""
echo "Step 7: Starting frontend container..."
docker run -d \
  --name budget-frontend \
  --restart unless-stopped \
  -p 80:80 \
  $FRONTEND_IMAGE

# ==========================================
# 8. Create deployment script for updates
# ==========================================
echo ""
echo "Step 8: Creating update script..."
cat > /opt/deploy-app.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

# Log to file and console
LOGFILE="/var/log/deploy-app.log"
exec > >(tee -a "$LOGFILE")
exec 2>&1

echo ""
echo "========================================="
echo "Budget Tracker - Redeployment"
echo "Started at: $(date)"
echo "========================================="

# Get AWS info
AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# Get image URLs from running containers
BACKEND_IMAGE=$(docker inspect budget-backend --format='{{.Config.Image}}')
FRONTEND_IMAGE=$(docker inspect budget-frontend --format='{{.Config.Image}}')

echo "Pulling latest images..."
docker pull $BACKEND_IMAGE
docker pull $FRONTEND_IMAGE

echo "Restarting containers..."
docker stop budget-backend budget-frontend
docker rm budget-backend budget-frontend

# Get DATABASE_URL from stopped container
DATABASE_URL=$(docker inspect budget-backend --format='{{range .Config.Env}}{{println .}}{{end}}' | grep DATABASE_URL | cut -d= -f2-)

# Start backend
docker run -d \
  --name budget-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  $BACKEND_IMAGE

# Start frontend
docker run -d \
  --name budget-frontend \
  --restart unless-stopped \
  -p 80:80 \
  $FRONTEND_IMAGE

echo ""
echo "========================================="
echo "✓ Deployment complete!"
echo "Finished at: $(date)"
echo "========================================="
echo ""
echo "Running containers:"
docker ps
echo ""
echo "Logs saved to: $LOGFILE"
DEPLOY_SCRIPT

chmod +x /opt/deploy-app.sh

# ==========================================
# 9. Setup automatic updates (optional)
# ==========================================
echo ""
echo "Step 9: Setting up CloudWatch agent for monitoring..."
# Could install CloudWatch agent here if needed

# ==========================================
# COMPLETE!
# ==========================================
echo ""
echo "========================================="
echo "✓ Deployment Complete!"
echo "========================================="
echo "Finished at: $(date)"
echo ""
echo "Running containers:"
docker ps
echo ""
echo "Backend logs:"
docker logs --tail 20 budget-backend
echo ""
echo "Frontend logs:"
docker logs --tail 20 budget-frontend
echo ""
echo "To redeploy later: sudo /opt/deploy-app.sh"
echo "========================================="
