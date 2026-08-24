output "api_public_ip" {
  description = "IP público (Elastic IP) para acessar a API"
  value       = aws_eip.api.public_ip
}

output "api_instance_id" {
  description = "ID da instância EC2 da API"
  value       = aws_instance.api.id
}

output "db_endpoint" {
  description = "Endpoint de conexão do banco de dados RDS"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "vpc_id" {
  description = "ID da VPC criada"
  value       = aws_vpc.main.id
}
