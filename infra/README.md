# Infraestrutura (Terraform)

Provisiona, na AWS, a infraestrutura necessária para rodar a TaskFlow API:

- **VPC** com subnet pública (API) e subnet privada (banco de dados)
- **EC2** (`t3.micro`) rodando a imagem Docker da API, com Elastic IP fixo
- **RDS PostgreSQL** (`db.t3.micro`), acessível apenas pela instância da API
- **Security groups** liberando somente as portas 22 (SSH), 80 e 443 (HTTP/HTTPS) na API, e 5432 apenas entre API e banco

## Como usar

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# edite terraform.tfvars com sua senha de banco e configurações

terraform init
terraform plan
terraform apply
```

## Destruir a infraestrutura

```bash
terraform destroy
```

## Variáveis sensíveis

A senha do banco (`db_password`) nunca deve ser versionada. Prefira passá-la via variável de ambiente:

```bash
export TF_VAR_db_password="sua-senha-segura"
terraform apply
```

No pipeline de CI/CD, use um secret configurado no GitHub Actions.
