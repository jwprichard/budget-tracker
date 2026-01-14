# One-Command Deployment to AWS EC2

## The Better Way ✅

**No SSH keys needed! No manual steps!** Everything happens automatically.

### How It Works

1. **Terraform creates all infrastructure** (VPC, RDS, ECR, IAM roles, EC2)
2. **GitHub Actions builds and pushes images** to ECR
3. **EC2 instance automatically**:
   - Waits for images to appear in ECR
   - Pulls images using IAM role (no credentials!)
   - Starts containers with DATABASE_URL from Terraform
   - Runs Prisma migrations
   - Your app is live!

**Total manual steps: ZERO** 🎉

---

## Deployment Steps

### 1. Push to GitHub

```bash
git add -A
git commit -m "Deploy infrastructure"
git push origin main
```

### 2. Wait

GitHub Actions will:
- ✅ Run Terraform (creates all AWS resources)
- ✅ Build Docker images
- ✅ Push to ECR
- ✅ EC2 auto-deploys containers

Takes about **10-15 minutes** on first run.

### 3. Get Your URL

After GitHub Actions completes, check the logs for:
```
Application URL: http://YOUR_EC2_IP
API URL: http://YOUR_EC2_IP:3000/api
```

Or run locally:
```bash
cd infra
terraform output app_url
```

Visit the URL - your app is live!

---

## What Happens Behind the Scenes

### Terraform Phase (Step 1-4 in GitHub Actions)

1. Creates ECR repositories (budget-backend, budget-frontend)
2. Creates VPC, subnets, security groups, RDS database
3. Creates IAM role with ECR pull permissions
4. Creates EC2 instance with user_data script

The **EC2 user_data script** (`infra/ec2-user-data.sh`) is templated by Terraform with:
- AWS region and account ID
- Database URL (with RDS endpoint)
- ECR image URLs

### Build & Push Phase (Step 5-8)

5. Docker builds backend and frontend
6. Images pushed to ECR

### Auto-Deploy Phase (happens on EC2)

7. EC2 boots up and runs user_data script
8. Script waits for images in ECR (polls every 30s)
9. Pulls images using IAM role
10. Starts backend container with DATABASE_URL
11. Waits for backend health check
12. Runs Prisma migrations
13. Starts frontend container

**Done!** No SSH required.

---

## Monitoring the Deployment

### Watch the EC2 bootstrap logs

```bash
# Get EC2 IP from Terraform
cd infra
EC2_IP=$(terraform output -raw ec2_public_ip)

# SSH in and watch logs (optional - only for debugging)
ssh ec2-user@$EC2_IP

# View user-data logs
sudo tail -f /var/log/user-data.log

# Check running containers
docker ps

# View backend logs
docker logs -f budget-backend

# View frontend logs
docker logs -f budget-frontend
```

---

## Updating Your App

### Just push to GitHub!

```bash
git add -A
git commit -m "Update feature"
git push origin main
```

GitHub Actions will:
1. Build new images
2. Push to ECR
3. ✅ **Automatically trigger EC2 to pull and restart**

Wait, how does EC2 know to update?

**Option 1:** Manual (for now)
```bash
ssh ec2-user@$EC2_IP
sudo /opt/deploy-app.sh
```

**Option 2:** Add to GitHub Actions (automated)
```yaml
# Add this step to .github/workflows/main.yml after pushing images
- name: Trigger EC2 update
  run: |
    aws ssm send-command \
      --instance-ids $(terraform output -raw ec2_instance_id) \
      --document-name "AWS-RunShellScript" \
      --parameters 'commands=["/opt/deploy-app.sh"]'
```

**Option 3:** Use AWS Systems Manager (recommended)
- Requires SSM agent on EC2 (pre-installed on Amazon Linux 2023)
- No SSH needed
- See: `docs/EC2-SSM-DEPLOYMENT.md` (TODO)

---

## Advantages Over SSH Approach

| Feature | SSH Approach ❌ | User Data Approach ✅ |
|---------|----------------|---------------------|
| SSH keys needed | Yes | No |
| Manual setup | Yes (generate keys, add to GitHub) | No |
| "One command" deploy | No (multi-step) | Yes (just git push) |
| Terraform outputs | Need to pass via SSH | Available in user_data |
| Security | Need to manage keys | IAM role only |
| Updates | SSH + script | Optional SSH or SSM |

---

## Troubleshooting

### EC2 is running but app not responding

1. **Check if user_data completed:**
   ```bash
   ssh ec2-user@$EC2_IP
   sudo tail -100 /var/log/user-data.log
   ```

   Look for: `✓ Deployment Complete!`

2. **Check if containers are running:**
   ```bash
   docker ps
   ```

   Should see `budget-backend` and `budget-frontend`

3. **Check container logs:**
   ```bash
   docker logs budget-backend
   docker logs budget-frontend
   ```

### User data script failed

Common issues:

**"Timeout waiting for images in ECR"**
- GitHub Actions hasn't finished pushing images yet
- Wait a few more minutes, then SSH in and run:
  ```bash
  sudo /opt/deploy-app.sh
  ```

**"Backend health check failed"**
- Database connection issue
- Check RDS security group allows EC2 inbound on port 5432
- Check DATABASE_URL in user_data.log

**"Permission denied pulling from ECR"**
- IAM role not attached or missing permissions
- Check: `aws sts get-caller-identity` (should show role)
- Re-apply Terraform:
  ```bash
  terraform destroy -target=aws_instance.app
  terraform apply
  ```

### App is working but updates aren't deploying

- New images are in ECR but EC2 still running old containers
- SSH in and manually run: `sudo /opt/deploy-app.sh`
- Or add SSM automation (see Option 3 above)

---

## Cost Comparison

### With This Setup (EC2 + User Data)

**Free Tier (First 12 Months):**
- ✅ EC2 t3.micro: FREE
- ✅ RDS db.t3.micro: FREE
- **Total: $0/month** for first year

**After Free Tier:**
- EC2 t3.micro: $8/month
- RDS db.t3.micro: $15/month
- **Total: $23-27/month**

### With Old SSH Setup

Same cost, but requires:
- ❌ Manual key generation
- ❌ Multiple GitHub secrets
- ❌ SSH configuration
- ❌ Multi-step deployment

### With ECS Fargate Setup

- $50-60/month
- More complex
- Overkill for personal projects

---

## What's Next?

### Optional Enhancements

1. **Add HTTPS**
   - Get domain name
   - Use Let's Encrypt (free SSL)
   - Or use CloudFront + ACM

2. **Auto-updates via SSM**
   - No SSH needed for updates
   - Fully automated CD pipeline

3. **CloudWatch monitoring**
   - Install CloudWatch agent
   - Set up alarms for container failures

4. **Backups**
   - RDS automated backups (already enabled)
   - Add S3 for file uploads

5. **CI/CD improvements**
   - Run tests before deploy
   - Blue-green deployments
   - Rollback capability

---

## Summary

✅ **One command:** `git push`
✅ **No SSH keys** to manage
✅ **No manual steps** in deployment
✅ **$0/month** for first year
✅ **Everything automated** by Terraform + user_data

This is how modern cloud deployments should work!

---

**Last Updated:** January 2026
