resource "aws_db_instance" "postgres" {
  engine = "postgres"
  engine_version = "16"
  instance_class = "db.t3.micro"
  allocated_storage = 20

  db_name = "budget_tracker"
  username = "budget_user"
  password = "budget_password"

  skip_final_snapshot = true
  publicly_accessible = false
  db_subnet_group_name = aws_db_subnet_group.main.name
}
