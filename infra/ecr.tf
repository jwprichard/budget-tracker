resource "aws_ecr_repository" "backend" {
  name         = "budget-backend"
  force_delete = true  # Allow deletion even when images exist
}

resource "aws_ecr_repository" "frontend" {
  name         = "budget-frontend"
  force_delete = true  # Allow deletion even when images exist
}