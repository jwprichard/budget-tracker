terraform {

  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }

  backend "s3" {
    bucket = "budget-tracker-terraform-state-068410980785"
    key    = "prod/terraform.tfstate"
    region = "ap-southeast-2"
  }
}

provider "aws" {
  region = "ap-southeast-2"
}