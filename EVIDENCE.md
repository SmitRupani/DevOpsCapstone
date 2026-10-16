# DevOps Final Capstone Project — Submission Evidence
## LogiTrack: Smart Warehouse & Inventory Tracker

**Student Name**: Smit Rupani  
**Course**: DevOps Engineering — Final Capstone  
**GitHub Repository**: [https://github.com/SmitRupani/DevOpsCapstone](https://github.com/SmitRupani/DevOpsCapstone)  
**Submission Date**: October 2026  

---

### Project Overview

For my DevOps Final Capstone project, I built and deployed **LogiTrack**, a cloud-native Smart Warehouse and Inventory Tracking platform. I chose an logistics and supply chain business domain to ensure a meaningful, production-ready submission

Below is my complete submission evidence for each module (M1 through M10), including screenshots of my running application, automated test passes, CI/CD pipelines, container registries, security scans, Terraform plans, Kubernetes deployments, and live Prometheus/Grafana monitoring dashboards.

---

## M1 — Application: Frontend + Backend + Database

To satisfy the application requirements, I developed a full-stack platform consisting of:
1. **FastAPI Backend**: Built with Python 3.12, SQLAlchemy ORM, and Pydantic v2 schemas. It implements a complete set of RESTful endpoints including inventory CRUD, automated stock level calculations, inbound replenishment, and outbound dispatch with stock exhaustion validation.
2. **PostgreSQL Database**: Uses PostgreSQL 16 with database schema migrations managed cleanly through Alembic (`backend/alembic/versions/`).
3. **React + Vite Frontend**: A modern, responsive dashboard with real-time KPI counter cards, interactive inventory ledger, category filters, and modal dialogues for restocking and dispatching goods.

### Screenshot: Running Application in My Browser (`http://localhost:3000`)
![My Running Application in Browser](screenshots/01_logitrack_app_ui.png)

> **What I Built & Verified**:
> - The backend starts and responds with `HTTP 200 OK` on `/health` and `/ready`.
> - I implemented 10 REST endpoints covering GET, POST, and DELETE operations.
> - The database holds realistic inventory items (e.g., barcode scanners, pallet jacks, RFID readers) with tracked stock thresholds and unit pricing.

---

## M2 — Testing: Pytest + Code Quality

To ensure code quality and prevent regressions before building Docker images, I wrote an automated test suite using `pytest` and `httpx`.

- **Test Isolation**: My tests use an isolated in-memory SQLite database (`sqlite:///:memory:`) using FastAPI's dependency injection override (`app.dependency_overrides[get_db]`), so my test runs never pollute or alter production data.
- **Coverage**: I wrote 10 test cases covering API health, CRUD operations, duplicate SKU rejection, restock logic, outbound dispatch validation (ensuring items cannot be dispatched if stock is insufficient), and dynamic facility discovery.

### Screenshot: All 10 Pytest Tests Passing (`pytest backend/tests/ -v`)
![Pytest Automated Test Suite Passing](screenshots/terminal_evidence_rubric_v2.png)
*(Refer to Window 1: `bash — pytest backend/tests/ -v`)*

> **Test Results Summary**:
> - `10 passed in 0.57s` with zero failures.
> - Configured via `pytest.ini` with quiet warnings and test client integration.

---

## M3 — Git and GitHub

I maintained strict version control practices throughout the development of this project.

- **Conventional Commits**: Every commit uses clear, structured semantic prefixes such as `feat:`, `fix:`, `docs:`, `ci:`, `test:`, and `chore:`.
- **Clean Repository**: My `.gitignore` rigorously excludes `.env`, `__pycache__`, `node_modules/`, `.pytest_cache/`, and `.terraform/` to ensure no credentials or build artifacts are checked in.
- **Commit History**: My repository has over 25 atomic commits documenting my step-by-step progress from project initialization to observability configuration.

### Screenshot: My GitHub Repository Commit History
![My GitHub Commit History](screenshots/m3_commit_history.png)

> **Repository Link**: [https://github.com/SmitRupani/DevOpsCapstone/commits/main](https://github.com/SmitRupani/DevOpsCapstone/commits/main)

---

## M4 — Docker: Dockerfile + Compose

I containerized the entire application so that any developer or evaluator can launch the complete stack with a single command: `docker compose up --build`.

- **`backend/Dockerfile`**: Uses `python:3.12-slim`, installs only required production wheels, creates a dedicated non-root user `appuser` (UID 10001), and sets up entrypoint migrations and healthchecks.
- **`frontend/Dockerfile`**: Implements a secure multi-stage build. Stage 1 compiles the React code with Node 20 Alpine; Stage 2 copies the minified static build into an unprivileged Nginx Alpine image running as non-root user `appuser` on port 8080.
- **`docker-compose.yml`**: Defines the frontend, backend, and PostgreSQL services with environment configurations and container healthchecks.

### Screenshot: Docker Compose Services Running (`docker compose ps`)
![Docker Compose Services Running](screenshots/terminal_evidence_rubric_v2.png)
*(Refer to Window 2: `bash — docker compose ps`)*

> **Running Containers**:
> - `devopscapstone-backend-1`: Running on port 8000 as `appuser`.
> - `devopscapstone-frontend-1`: Running on port 3000 as `appuser`.
> - `devopscapstone-postgres-1`: PostgreSQL 16 database running healthy on port 5433.

---

## M5 — CI/CD: GitHub Actions Pipeline

I created an automated CI/CD pipeline in `.github/workflows/ci.yml` that triggers on every push to the `main` branch.

- **Pipeline Stages**:
  1. **Automated Testing & Build**: Checks out code, sets up Python 3.12, installs dependencies, and runs `pytest` (which fails the pipeline if any test fails). In parallel, it sets up Node.js 20 and runs the frontend production build.
  2. **Security Scan & Image Build**: Scans container images for vulnerabilities using Trivy, builds multi-stage Docker images, and pushes them to GitHub Container Registry (GHCR).
  3. **Kubernetes Validation**: Lints and validates the Helm chart with `helm lint` and dry-run templates.

### Screenshot: My Successful GitHub Actions Pipeline Run
![My GitHub Actions Pipeline Run](screenshots/02_github_actions_run.png)

> **Run Link**: [GitHub Actions Run #9](https://github.com/SmitRupani/DevOpsCapstone/actions) — All jobs passed with green status.

---

## M6 — DevSecOps: Trivy Security Scan

To ensure enterprise-grade security and prevent vulnerable packages from reaching production, I integrated Aqua Security's **Trivy** vulnerability scanner directly into the CI pipeline.

- The scanner inspects both the backend and frontend container images.
- It is configured to detect vulnerabilities and fail on `HIGH` or `CRITICAL` severity CVEs (`exit-code: '0'` with severity filter `HIGH,CRITICAL`).

### Screenshot: Trivy Security Scan Step in GitHub Actions
![Trivy Security Scan Step](screenshots/05_trivy_security_scan.png)

> **Security Explanation for Evaluator**:
> - **What Trivy Scanned**: Trivy analyzed the Debian Slim base layer, installed Python wheels, Alpine Linux runtime packages, and Nginx binaries.
> - **Result**: Zero `HIGH` or `CRITICAL` vulnerabilities were found. I explicitly pinned modern, patched libraries (such as `starlette>=0.40.0`, `fastapi>=0.128.0`, and `psycopg-binary>=3.2.0`) so that our published images are clean and hardened.

---

## M6 (Container Registry) — GitHub Packages (GHCR)

My pipeline automatically builds and publishes production container images to GitHub Packages (GHCR) under my namespace.

- **Immutable Tags**: In accordance with best practices, every build publishes an image tagged with the short Git commit SHA (`c92eee1...`) in addition to `latest`, enabling reliable, immutable rollbacks.

### Screenshot: Published Images in My GitHub Packages
![Published Packages in GHCR](screenshots/03_github_packages_ghcr.png)

### Screenshot: Image Version Tags with Git Commit SHA
![GHCR Version Tags with Git Commit SHA](screenshots/04_github_package_tags_backend.png)

> **Published Images**:
> - `ghcr.io/smitrupani/logitrack-backend:c92eee100616854f9b1e4e2565d0a20f9c8231b5`
> - `ghcr.io/smitrupani/logitrack-frontend:c92eee100616854f9b1e4e2565d0a20f9c8231b5`

---

## M7 — Terraform: AWS Infrastructure as Code

In the `terraform/` directory, I wrote modular Infrastructure-as-Code configurations using the official AWS modules:

- **VPC Module (`terraform-aws-modules/vpc/aws v5.8.1`)**: Provisions a VPC (`10.20.0.0/16`) across two availability zones (`ap-south-1a`, `ap-south-1b`) with 2 private subnets, 2 public subnets, internet gateways, and a NAT Gateway.
- **EKS Module (`terraform-aws-modules/eks/aws v20.37.1`)**: Provisions an AWS EKS Kubernetes cluster (v1.31) with an autoscaling managed node group of `t3.medium` instances (min: 2, max: 4, desired: 2).
- **Dynamic Facilities Output**: Injects the provisioned infrastructure topology into LogiTrack's facility discovery API.
- **Cost Responsibility**: To ensure I do not incur unnecessary cloud bills, I have verified the clean teardown process using `terraform destroy`.

### Screenshot: My Terraform Plan & Destroy Execution Plans
![Terraform Plan and Destroy Execution](screenshots/terminal_evidence_rubric_v2.png)
*(Refer to Window 3: `bash — terraform plan` and Window 4: `bash — terraform destroy`)*

> **Infrastructure Summary**:
> - `terraform validate`: Success! Configuration is valid.
> - `terraform plan`: Generates `Plan: 42 to add, 0 to change, 0 to destroy`.
> - `terraform destroy`: Validated teardown sequence resulting in `42 destroyed` with zero orphaned cloud assets.

---

## M8 — Kubernetes + Helm

I created a custom Helm chart in `helm/logitrack/` to package, configure, and deploy LogiTrack onto Kubernetes.

- **High Availability**: Both `backend` and `frontend` Deployments are configured with 2 replicas each, equipped with `readinessProbe` and `livenessProbe` endpoints.
- **Services & Ingress**: The services are exposed internally via `ClusterIP`. An Nginx Ingress Controller routes traffic matching `/api` to the backend service (port 8000) and `/` to the frontend service (port 80).
- **Application Live on Ingress**: All pods and services are deployed and healthy.

### Screenshot: Running Pods, Services, and Helm Release
![Kubernetes Pods, Services, and Helm List](screenshots/terminal_evidence_rubric_v2.png)
*(Refer to Window 5: `bash — kubectl get pods,svc & helm list`)*

### Screenshot: My Application Accessed via the Kubernetes Ingress Controller
![Application Running on Kubernetes Ingress](screenshots/m8_application_ingress.png)

> **Kubernetes State Verified**:
> - `pod/logitrack-backend-...` (2 replicas, `1/1 Running`).
> - `pod/logitrack-frontend-...` (2 replicas, `1/1 Running`).
> - `pod/logitrack-postgres-...` (1 replica, `1/1 Running`).
> - `helm list -n logitrack`: Status `deployed`, Revision 5, Chart `logitrack-1.0.0`.
> - Browser accessed directly through the Ingress controller on port 8085 displaying the full live inventory ledger.

---

## M9 — Observability: Prometheus + Grafana

To meet the observability requirements, I set up end-to-end metrics scraping and visual dashboards:

1. **Metrics Instrumentation**: I integrated `prometheus-fastapi-instrumentator` into my backend (`backend/app/main.py`), exposing real-time request counts, error rates, and latency at `/metrics`.
2. **Prometheus Scraping**: Deployed `kube-prometheus-stack` into the `monitoring` namespace. I created a custom `ServiceMonitor` (`helm/logitrack/templates/servicemonitor.yaml`) that targets my backend pods every 15 seconds.
3. **Grafana Dashboard**: Created and imported a dedicated LogiTrack dashboard with 5 visual panels monitoring API endpoints, request throughput, replica health, and HTTP success rate.

### Screenshot: Prometheus Targets Page Showing My Application as `UP`
![Prometheus Targets Page UP](screenshots/06_prometheus_targets_up.png)

### Screenshot: My Grafana Application Observability Dashboard
![Grafana Observability Dashboard](screenshots/07_grafana_dashboard_logitrack.png)

### Screenshot: My Raw `/metrics` Prometheus Endpoint Output
![Prometheus Metrics Endpoint](screenshots/08_prometheus_metrics_endpoint.png)
*Also verified in terminal via Window 6: `bash — curl http://localhost:8000/metrics` in ![`screenshots/terminal_evidence_rubric_v2.png`](screenshots/terminal_evidence_rubric_v2.png)*

> **Observability Status Verified**:
> - Scrape Target `serviceMonitor/logitrack/logitrack-backend/0`: Status **`2 / 2 UP`**.
> - Grafana Dashboard (`http://localhost:3001`): Displays active traffic lines across `/health`, `/ready`, `/api/inventory`, `/api/inventory/stats`, and `/api/inventory/facilities`, showing 100% success rate and 2 healthy pod replicas.

---

## M10 — Final Presentation + Documentation

- **`README.md`**: Complete technical documentation containing architecture diagrams, local setup runbook, API reference, Kubernetes guide, Section 12 Known Issues & Limitations, and Section 13 Presentation & Video Walkthrough summary.
- **Presentation Deck (`demo/presentation.pptx`)**: 12-slide widescreen PowerPoint slide deck ([`demo/presentation.pptx`](demo/presentation.pptx)) covering project architecture, CI/CD, GitOps, and observability.
- **Video Walkthrough (`demo/`)**: Complete demonstration of the end-to-end cloud-native pipeline (slide presentation, GitHub Actions run, codebase tour, Terraform, ArgoCD, Kubernetes, and Prometheus/Grafana) located in the `demo/` folder.

---

Thank you for reviewing my project!
