# infra/terraform/main.tf
provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_compute_network" "vpc" {
  name                    = "amdox-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "amdox-subnet"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.0.0.0/24"
}

resource "google_container_cluster" "gke" {
  name     = "amdox-gke-cluster"
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1
  network                  = google_compute_network.vpc.name
  subnetwork               = google_compute_subnetwork.subnet.name
}

resource "google_container_node_pool" "nodes" {
  name       = "amdox-node-pool"
  location   = var.region
  cluster    = google_container_cluster.gke.name
  node_count = var.node_count

  node_config {
    preemptible  = true
    machine_type = "e2-medium"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

variable "project_id" {
  type    = string
  default = "amdox-production"
}

variable "region" {
  type    = string
  default = "us-east1"
}

variable "node_count" {
  type    = number
  default = 3
}
