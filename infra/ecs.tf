resource "aws_ecs_cluster" "main" {
  name = "budget-tracker"
}

resource "aws_ecs_task_definition" "api" {
  family                   = "budget-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu    = 512
  memory = 1024

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
  cpu    = 256
  memory = 512

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${aws_ecr_repository.frontend.repository_url}:latest"
      portMappings = [{ containerPort = 5173 }]

      environment = [
        { name = "VITE_API_URL", value = "http://api.budget.local/api" }
      ]
    }
  ])
}
