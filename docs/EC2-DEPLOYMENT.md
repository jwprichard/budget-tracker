# EC2 Deployment Guide

## What Was Wrong & What Got Fixed

### 🔴 The Problem
Your EC2 instance couldn't pull Docker images from ECR because:

1. **No IAM Role** - EC2 had no permissions to access ECR
2. **No Instance Profile** - IAM role wasn't attached to the instance
3. **Missing ECR Permissions** - No policy allowing `ecr:GetAuthorizationToken`, `ecr:BatchGetImage`, etc.

### ✅ The Fix

**Added to `infra/iam.tf`:**
- `aws_iam_role.ec2_role` - IAM role for EC2
- `aws_iam_role_policy.ec2_ecr_policy` - Permissions to pull from ECR
- `aws_iam_instance_profile.ec2_profile` - Profile to attach role to EC2

**Updated `infra/ec2.tf`:**
- Added `iam_instance_profile` to EC2 instance
- Enhanced user_data with logging and error handling
- Pre-creates `/home/ec2-user/app` directory

**Created `infra/deploy-to-ec2.sh`:**
- Automated deployment script
- Uses IAM role (no credentials needed!)
- Handles ECR login, image pull, container restart

**Updated `.github/workflows/main.yml`:**
- Gets EC2 IP and RDS endpoint from Terraform
- Uses SSH to deploy to EC2
- Runs deployment script via curl (always gets latest version)
- Runs Prisma migrations inside backend container

---

## 🚀 How to Deploy

### Prerequisites

1. **SSH Key Pair**

   Generate a key pair if you don't have one:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/budget-tracker-ec2 -C "budget-tracker"
   ```

   This creates:
   - `~/.ssh/budget-tracker-ec2` (private key - keep secret!)
   - `~/.ssh/budget-tracker-ec2.pub` (public key)

2. **Add Public Key to EC2 Instance**

   You need to add the public key to Terraform so it's installed on the EC2 instance.

   Update `infra/ec2.tf` to include:
   ```hcl
   resource "aws_key_pair" "deployer" {
     key_name   = "budget-tracker-deployer"
     public_key = file("~/.ssh/budget-tracker-ec2.pub")  # Path to your public key
   }

   resource "aws_instance" "app" {
     # ... existing config ...
     key_name = aws_key_pair.deployer.key_name  # Add this line
   }
   ```

3. **Add GitHub Secret**

   Add your **private key** to GitHub Secrets:

   - Go to: GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `EC2_SSH_KEY`
   - Value: Paste entire content of `~/.ssh/budget-tracker-ec2` (private key)

   ```bash
   # Copy private key to clipboard (Mac):
   cat ~/.ssh/budget-tracker-ec2 | pbcopy

   # Copy private key to clipboard (Linux):
   cat ~/.ssh/budget-tracker-ec2 | xclip -selection clipboard

   # Or just print it and copy manually:
   cat ~/.ssh/budget-tracker-ec2
   ```

### Deployment Steps

1. **Push Changes**
   ```bash
   git add -A
   git commit -m "Setup EC2 deployment with IAM role"
   git push origin main
   ```

2. **GitHub Actions Will:**
   - ✅ Run Terraform to create infrastructure
   - ✅ Create IAM role with ECR permissions
   - ✅ Create EC2 instance with instance profile
   - ✅ Build Docker images
   - ✅ Push images to ECR
   - ✅ SSH into EC2 and run deployment script
   - ✅ Pull images using IAM role (no credentials!)
   - ✅ Start containers
   - ✅ Run database migrations

3. **Access Your App**

   After deployment, get your EC2 public IP:
   ```bash
   cd infra
   terraform output ec2_public_ip
   ```

   Visit: `http://YOUR_EC2_IP`

---

## 🔍 Troubleshooting

### Check if IAM Role is Working

SSH into your EC2 instance:
```bash
ssh -i ~/.ssh/budget-tracker-ec2 ec2-user@YOUR_EC2_IP
```

Test ECR access:
```bash
# This should work if IAM role is properly attached
aws ecr get-login-password --region ap-southeast-2

# Check instance metadata (should show IAM role)
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Try pulling an image
aws ecr get-login-password --region ap-southeast-2 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-2.amazonaws.com

docker pull ACCOUNT_ID.dkr.ecr.ap-southeast-2.amazonaws.com/budget-backend:latest
```

### Check User Data Logs

The user_data script logs everything:
```bash
ssh -i ~/.ssh/budget-tracker-ec2 ec2-user@YOUR_EC2_IP

# View user-data logs
sudo cat /var/log/user-data.log

# Check if Docker is running
sudo systemctl status docker

# Check Docker version
docker --version

# Check AWS CLI
aws --version
```

### Check Container Logs

```bash
# View running containers
docker ps

# View backend logs
docker logs budget-backend

# View frontend logs
docker logs budget-frontend

# Follow backend logs in real-time
docker logs -f budget-backend
```

### Manual Deployment

If GitHub Actions fails, you can deploy manually:

```bash
# SSH into EC2
ssh -i ~/.ssh/budget-tracker-ec2 ec2-user@YOUR_EC2_IP

# Set DATABASE_URL
export DATABASE_URL="postgresql://budget_user:budget_password@YOUR_RDS_ENDPOINT:5432/budget_tracker"

# Run deployment script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/budget-tracker/main/infra/deploy-to-ec2.sh -o /tmp/deploy.sh
chmod +x /tmp/deploy.sh
/tmp/deploy.sh
```

### Common Issues

**1. "Permission denied (publickey)"**
- Check that EC2 has your public key installed
- Verify you're using the correct private key
- Ensure private key has correct permissions: `chmod 600 ~/.ssh/budget-tracker-ec2`

**2. "Error response from daemon: pull access denied"**
- IAM role not attached or missing permissions
- Check: `aws sts get-caller-identity` (should show EC2 role)
- Recreate instance profile: `terraform destroy -target=aws_iam_instance_profile.ec2_profile && terraform apply`

**3. "Unable to connect to Docker daemon"**
- User not in docker group: `sudo usermod -a -G docker ec2-user`
- Log out and back in for group membership to take effect
- Or use sudo: `sudo docker ps`

**4. Backend container keeps restarting**
- Check logs: `docker logs budget-backend`
- Usually DATABASE_URL is wrong or RDS not accessible
- Verify security group allows EC2 → RDS (port 5432)

---

## 💰 Cost with EC2 Setup

**Free Tier (First 12 Months):**
- ✅ EC2 t3.micro: FREE (750 hours/month)
- ✅ RDS db.t3.micro: FREE (750 hours/month)
- ✅ 30GB EBS storage: FREE
- **Total: $0/month**

**After Free Tier:**
- EC2 t3.micro: ~$8/month
- RDS db.t3.micro: ~$15/month
- EBS storage (30GB): ~$3/month
- Data transfer: ~$1-5/month
- **Total: ~$27-30/month**

Much cheaper than the $50-60/month Fargate setup!

---

## 🔄 Updating Your App

Every git push to main will:
1. Build new Docker images
2. Push to ECR
3. SSH into EC2
4. Pull latest images
5. Restart containers
6. Run migrations

No manual steps needed!

---

## 📊 Monitoring

**View resource usage:**
```bash
ssh -i ~/.ssh/budget-tracker-ec2 ec2-user@YOUR_EC2_IP

# CPU and memory
top

# Disk usage
df -h

# Docker stats
docker stats

# Container resource usage
docker stats budget-backend budget-frontend
```

**CloudWatch (AWS Console):**
- EC2 → Instances → Your instance → Monitoring tab
- View CPU, network, disk metrics

---

## 🔐 Security Notes

1. **Restrict SSH Access**

   Currently SSH is open to 0.0.0.0/0 (all IPs). Restrict it:

   In `infra/ec2.tf`, change:
   ```hcl
   ingress {
     from_port   = 22
     to_port     = 22
     protocol    = "tcp"
     cidr_blocks = ["YOUR_IP_ADDRESS/32"]  # Change this!
   }
   ```

2. **Change RDS Password**

   The default password is `budget_password` - change it!

   In `infra/rds.tf`:
   ```hcl
   password = var.db_password  # Use variable instead
   ```

3. **Enable HTTPS**

   Currently only HTTP (port 80). For production:
   - Get a domain name
   - Use Route 53 for DNS
   - Request SSL certificate from ACM
   - Configure HTTPS on ALB or use Let's Encrypt on EC2

---

## ✅ Checklist

Before pushing to production:

- [ ] Generated SSH key pair
- [ ] Added public key to EC2 in Terraform
- [ ] Added private key to GitHub Secrets (`EC2_SSH_KEY`)
- [ ] Restricted SSH access to your IP
- [ ] Changed RDS password
- [ ] Tested deployment in GitHub Actions
- [ ] Verified app is accessible via EC2 public IP
- [ ] Checked container logs (no errors)
- [ ] Tested database connection
- [ ] Set up CloudWatch alarms (optional)
- [ ] Configure domain name + HTTPS (optional)

---

**Last Updated:** January 2026
