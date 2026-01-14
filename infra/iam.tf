# ECS Task Execution Role (for Fargate to pull images and write logs)
resource "aws_iam_role" "ecs_execution_role" {
  name = "budget-tracker-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role (for application to access AWS services if needed)
resource "aws_iam_role" "ecs_task_role" {
  name = "budget-tracker-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Add permissions if your app needs to access other AWS services (S3, SES, etc.)
# resource "aws_iam_role_policy" "ecs_task_policy" {
#   role = aws_iam_role.ecs_task_role.id
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = ["s3:GetObject", "s3:PutObject"]
#         Resource = ["arn:aws:s3:::your-bucket/*"]
#       }
#     ]
#   })
# }

# ========================================
# EC2 Instance Role (for ECR access)
# ========================================

resource "aws_iam_role" "ec2_role" {
  name = "budget-tracker-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "budget-tracker-ec2-role"
  }
}

# Policy to allow EC2 to pull from ECR
resource "aws_iam_role_policy" "ec2_ecr_policy" {
  name = "budget-tracker-ec2-ecr-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Instance profile to attach the role to EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "budget-tracker-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name = "budget-tracker-ec2-profile"
  }
}
