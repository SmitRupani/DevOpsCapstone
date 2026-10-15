variable "aws_region" {
  description = "AWS region for provisioning infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "logitrack-eks"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}
