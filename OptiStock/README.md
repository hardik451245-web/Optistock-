# OptiStock AI

> **Smarter Inventory | Higher Profits** — An intelligent retail stock management, dynamic expiry pricing, and point-of-sale optimization platform.

---

## Live Demo

- **Frontend (Vercel):** [https://optistock-kappa.vercel.app/](https://optistock-kappa.vercel.app/)
- **Backend (Render):** [https://optistock-backend-syu1.onrender.com](https://optistock-backend-syu1.onrender.com)
- **Health Check:** [https://optistock-backend-syu1.onrender.com/health](https://optistock-backend-syu1.onrender.com/health)

### Demo Credentials
- **Manager:** `manager@optistock.com` / `manager123`
- **Cashier:** `cashier@optistock.com` / `cashier123`

---

## Directory Overview

- **`optistock-backend/`**: Java 17 + Spring Boot 3.3.4 REST API service.
  - To run: `cd optistock-backend && mvn spring-boot:run "-Dspring-boot.run.profiles=demo"`
  - To test: `cd optistock-backend && mvn test`
- **`optistock-frontend/`**: React 19 + Vite Point of Sale and Manager Dashboard.
  - To run: `cd optistock-frontend && npm install && npm run dev`
  - To test: `cd optistock-frontend && npx playwright test`

See root [README.md](../README.md) for full project architecture and documentation.
