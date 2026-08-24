terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend remoto para o estado do Terraform (recomendado para times).
  # Descomente e ajuste para usar um bucket S3 próprio:
  #
  # backend "s3" {
  #   bucket = "taskflow-api-terraform-state"
  #   key    = "infra/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}
