# Single-Server Observability Deployment Plan

**Status:** Architecture and configuration values defined. Ready for implementation on the production server.

---

## Architecture & Agent Installation Map

Since this is a zero-cost, single-server deployment, all agents will be installed on the **same production server** where the Node.js application is running. Resource limits must be strictly enforced via Docker Compose to protect the main application.

| Tool / Agent | Installation Location | CPU/RAM Limit | Purpose |
| --- | --- | --- | --- |
| **Pino Logger** | Inside Node.js Code | N/A | Generates structured JSON application logs. |
| **Prom-client** | Inside Node.js Code | N/A | Exposes `/metrics` endpoint for the Node app. |
| **Promtail** | Docker Container | 0.1 vCPU / 100MB | Reads Node.js log files from the OS and ships them to Loki. |
| **Loki** | Docker Container | 0.2 vCPU / 200MB | Indexes and stores logs. Compresses data automatically. |
| **Prometheus** | Docker Container | 0.2 vCPU / 250MB | Scrapes metrics from Node API and all exporters every 15s. |
| **Grafana** | Docker Container | 0.1 vCPU / 150MB | Hosts dashboards and alerting UI. |
| **Node Exporter** | Host OS or Docker | 0.05 vCPU / 50MB | Exposes Host CPU, RAM, Disk, and Network metrics. |
| **MongoDB Atlas Exporter** | Docker Container | 0.05 vCPU / 50MB | Pulls cloud MongoDB cluster metrics (connections, ops, latency, replication) for Prometheus. |
| **Redis Exporter** | Docker Container | 0.05 vCPU / 50MB | Connects to Redis to expose memory/hit-rate metrics. |

---

## Phase 1 — Application Logging & Telemetry (Node.js)

* [x] **Install Core Dependencies:** `pino` and `prom-client` already installed in `apps/api/package.json`.
* [ ] **Configure Logging Levels:**
* Map `HTTP >= 500` and unhandled exceptions to `ERROR`.
* Map `HTTP >= 400` (Bad requests/Unauthorized) to `WARN`.
* Map standard traffic and lifecycle events to `INFO`.


* [x] **Global Error Capturing:** Implemented in `apps/api/src/index.ts` with `pino.fatal()` and process termination.
* [x] **Frontend Error Boundary:** Implemented in `src/components/ErrorBoundary.tsx`, posting stack traces to `/api/v1/logs/client-error`.
* [x] **API Metrics Middleware:** Implemented in `apps/api/src/lib/metrics.ts` and exposed via `/metrics` route in `apps/api/src/app.ts`.

## Phase 2 — Log Storage, Compression & Retention

* [x] **Host OS Retention (Raw Files):** Added repo-managed template at `monitoring/logrotate/webapp` for `/etc/logrotate.d/webapp`.
* **Rule 1:** Rotate logs daily.
* **Rule 2:** Keep a total of **90 days** of logs.
* **Rule 3 (Compression):** Apply gzip compression, but use a `postrotate` script with `find /var/log/webapp/ -name "*.log.*.gz" -mtime -7 -exec gunzip {} \;` to ensure the **last 7 days remain uncompressed**.


* [x] **Loki TSDB Retention:** Configured in `monitoring/loki/local-config.yaml` with `compactor.retention_enabled: true` and `retention_period: 2160h`.
* **Rule 1:** Set `retention_enabled: true` under the `compactor` block.
* **Rule 2:** Set `limits_config: retention_period: 2160h` (90 days) to forcefully drop old data.
* **Rule 3 (Compression):** Allow Loki to use its native snappy/gzip chunk compression automatically on ingestion to optimize disk space.



## Phase 3 — Infrastructure Agents & Orchestration

* [x] **Docker Compose Setup:** `docker-compose.yml` now defines Prometheus, Loki, Promtail, Grafana, Node Exporter, MongoDB Atlas Exporter, and Redis Exporter.
* [x] **Promtail Configuration:** `/var/log/webapp` is mounted and `monitoring/promtail/config.yml` now tails JSON logs and labels `level`.
* [x] **Database Exporter Configuration:**
* Configure MongoDB Cloud exporter credentials (Atlas project/organization access with read-only monitoring scope).
* Configure Atlas target identifiers (project ID, cluster name, and API endpoint values required by the exporter).
* Pass the Redis connection string to the Redis Exporter.


* [x] **Apply Hard Limits:** Added `deploy.resources.limits` to monitoring and exporter services in `docker-compose.yml`.

## Phase 4 — IT Ops Dashboards (Grafana Provisioning)

Dashboards must be saved as JSON files in the repository (`grafana/provisioning/dashboards/`) so Grafana auto-loads them on startup.

* [x] **Dashboard 1: NOC Overview (High-Level Health)**
* Single stat panel: Global HTTP 5xx Error Rate (Alert if > 1%).
* Gauge panel: API P95 Latency (Alert if > 500ms).
* Boolean status: System Uptime (Up/Down).
* Single stat panel: Active MongoDB connection count.


* [x] **Dashboard 2: Infrastructure Health**
* Time-series graph: CPU & Load average per core.
* Time-series graph: Node.js memory utilization (Available vs. Used).
* Gauge panel: Host Disk space exhaustion percentage (Critical alert if > 85%).


* [x] **Dashboard 3: Application Performance (APM)**
* Bar chart: Requests Per Second (RPS) grouped by API route.
* Table: Top 5 slowest endpoints by duration.
* Live log panel: Real-time Loki stream explicitly filtered to `{level="error"}` and `{level="fatal"}`.


* [x] **Dashboard 4: State & Storage (MongoDB + Redis)**
* Gauge panel: Redis Cache Hit Rate (> 80% target).
* Time-series graph: Redis Memory Fragmentation.
* Time-series graph: MongoDB operation latency (read/write/command).
* Time-series graph: MongoDB operation throughput (insert/query/update/delete rates).
* Gauge panel: MongoDB connection utilization (% used vs configured limits).
* Time-series graph: MongoDB replication lag (when using replica sets / Atlas clusters that expose replication metrics).

## Assumptions

* MongoDB is managed in the cloud (MongoDB Atlas or equivalent), so metrics are collected through a cloud exporter/API integration rather than direct local database scraping.