resource "aws_ecs_cluster" "main" {
  name = "budget-tracker"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "budget-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "api"
      image = "${aws_ecr_repository.backend.repository_url}:latest"
      portMappings = [{ containerPort = 3000 }]

      environment = [
        {
          name  = "DATABASE_URL"
          value = "postgresql://budget_user:budget_password@${aws_db_instance.postgres.address}:5432/budget_tracker"
        },
        { name = "PORT", value = "3000" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/budget-api"
          "awslogs-region"        = "ap-southeast-2"
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      }
    }
  ])
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "budget-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${aws_ecr_repository.frontend.repository_url}:latest"
      portMappings = [{ containerPort = 80 }]

      environment = [
        { name = "VITE_API_URL", value = "http://${aws_lb.main.dns_name}/api" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/budget-frontend"
          "awslogs-region"        = "ap-southeast-2"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/budget-api"
  retention_in_days = 7

  tags = {
    Name = "budget-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/budget-frontend"
  retention_in_days = 7

  tags = {
    Name = "budget-frontend-logs"
  }
}

# ECS Service for API
resource "aws_ecs_service" "api" {
  name            = "budget-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution_role_policy
  ]

  tags = {
    Name = "budget-api-service"
  }
}

# ECS Service for Frontend
resource "aws_ecs_service" "frontend" {
  name            = "budget-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  depends_on = [
    aws_lb_listener.http,
    aws_iam_role_policy_attachment.ecs_execution_role_policy
  ]

  tags = {
    Name = "budget-frontend-service"
  }
}
