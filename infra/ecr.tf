resource "aws_ecr_repository" "backend" {
  name = "budget-backend"
}

resource "aws_ecr_repository" "frontend" {
  name = "budget-frontend"
}