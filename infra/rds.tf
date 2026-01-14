# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "budget-tracker-rds"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  # Allow inbound from ECS tasks
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "budget-tracker-rds"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "budget-tracker-db-subnet-group"
  subnet_ids = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = {
    Name = "budget-tracker-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name  = "budget_tracker"
  username = "budget_user"
  password = "budget_password"

  skip_final_snapshot    = true
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  tags = {
    Name = "budget-tracker-db"
  }
}
