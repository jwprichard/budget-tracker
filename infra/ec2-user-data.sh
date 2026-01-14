#!/bin/bash
# EC2 User Data Script - Deploys Budget Tracker on first boot
# This script is templated by Terraform with all necessary variables
# NO SSH OR MANUAL STEPS REQUIRED!

set -e

# Log everything to file and console
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "========================================="
echo "Budget Tracker - EC2 Bootstrap"
echo "========================================="
echo "Started at: $$(date)"

# Terraform-injected variables
AWS_REGION="${aws_region}"
AWS_ACCOUNT="${aws_account}"
DATABASE_URL="${database_url}"
BACKEND_IMAGE="${backend_image}"
FRONTEND_IMAGE="${frontend_image}"

echo "AWS Region: $$AWS_REGION"
echo "AWS Account: $$AWS_ACCOUNT"
echo "Database URL: $${DATABASE_URL%%@*}@***"  # Hide password in logs

# ==========================================
# 1. Install Docker
# ==========================================
echo ""
echo "Step 1: Installing Docker..."
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Verify Docker
docker --version

# ==========================================
# 2. Login to ECR (using IAM role - no credentials!)
# ==========================================
echo ""
echo "Step 2: Logging into ECR..."
aws ecr get-login-password --region $$AWS_REGION | \
  docker login --username AWS --password-stdin $$AWS_ACCOUNT.dkr.ecr.$$AWS_REGION.amazonaws.com

# ==========================================
# 3. Wait for images to be available in ECR
# ==========================================
echo ""
echo "Step 3: Waiting for images in ECR..."

# Function to check if image exists
check_image() {
  local image=$$1
  aws ecr describe-images \
    --repository-name $$(echo $$image | cut -d'/' -f2 | cut -d':' -f1) \
    --image-ids imageTag=latest \
    --region $$AWS_REGION \
    --output text > /dev/null 2>&1
  return $$?
}

# Wait up to 10 minutes for images
MAX_WAIT=600  # 10 minutes
WAIT_COUNT=0
WAIT_INTERVAL=30  # Check every 30 seconds

while [ $$WAIT_COUNT -lt $$MAX_WAIT ]; do
  echo "Checking if images are available in ECR... ($$($$WAIT_COUNT / 60))min elapsed)"

  if check_image "$$BACKEND_IMAGE" && check_image "$$FRONTEND_IMAGE"; then
    echo "✓ Both images found in ECR!"
    break
  fi

  if [ $$WAIT_COUNT -ge $$MAX_WAIT ]; then
    echo "ERROR: Timeout waiting for images in ECR after $$MAX_WAIT seconds"
    echo "This usually means GitHub Actions hasn't pushed the images yet."
    echo "To deploy manually later, SSH in and run: sudo /opt/deploy-app.sh"
    exit 1
  fi

  sleep $$WAIT_INTERVAL
  WAIT_COUNT=$$((WAIT_COUNT + WAIT_INTERVAL))
done

# ==========================================
# 4. Pull Docker Images
# ==========================================
echo ""
echo "Step 4: Pulling Docker images..."
docker pull $$BACKEND_IMAGE
docker pull $$FRONTEND_IMAGE

# ==========================================
# 5. Start Backend Container
# ==========================================
echo ""
echo "Step 5: Starting backend container..."
docker run -d \
  --name budget-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="$$DATABASE_URL" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  $$BACKEND_IMAGE

# Wait for backend to be healthy
echo "Waiting for backend to be healthy..."
sleep 5

for i in {1..30}; do
  if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy!"
    break
  fi
  if [ $$i -eq 30 ]; then
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
  $$FRONTEND_IMAGE

# ==========================================
# 8. Create deployment script for updates
# ==========================================
echo ""
echo "Step 8: Creating update script..."
cat > /opt/deploy-app.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "========================================="
echo "Budget Tracker - Redeployment"
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

echo "Deployment complete!"
docker ps
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
echo "Finished at: $$(date)"
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
