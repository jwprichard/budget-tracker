# GitHub Actions Deployer User Permissions
# This assumes you have an IAM user named "github.deployer@budget.com" created manually
# We're adding additional permissions needed for the deployment workflow

# Reference the existing IAM user
data "aws_iam_user" "github_deployer" {
  user_name = "github.deployer@budget.com"
}

# Policy for SSM access (to trigger container updates)
resource "aws_iam_user_policy" "github_deployer_ssm" {
  name = "GitHubDeployerSSMPolicy"
  user = data.aws_iam_user.github_deployer.user_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ssm:ListCommandInvocations"
        ]
        Resource = [
          "arn:aws:ec2:*:*:instance/*",
          "arn:aws:ssm:*:*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:DescribeInstanceInformation"
        ]
        Resource = "*"
      }
    ]
  })
}

# Note: The user should already have permissions for:
# - ECR (push/pull images)
# - Terraform state (S3, DynamoDB if using remote state)
# - EC2, VPC, RDS, IAM (for Terraform to create infrastructure)
