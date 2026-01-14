# Outputs for Budget Tracker Infrastructure

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "URL to access the application"
  value       = "http://${aws_lb.main.dns_name}"
}

output "db_address" {
  description = "RDS database endpoint address"
  value       = aws_db_instance.postgres.address
}

output "db_endpoint" {
  description = "RDS database endpoint (includes port)"
  value       = aws_db_instance.postgres.endpoint
}

output "ecr_backend_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR repository URL for frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

# output "ecs_cluster_name" {
#   description = "ECS cluster name"
#   value       = aws_ecs_cluster.main.name
# }

# output "api_service_name" {
#   description = "ECS service name for API"
#   value       = aws_ecs_service.api.name
# }

# output "frontend_service_name" {
#   description = "ECS service name for frontend"
#   value       = aws_ecs_service.frontend.name
# }
