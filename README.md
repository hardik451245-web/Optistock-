# OptiStock AI

> **Smarter Inventory | Higher Profits** — An intelligent retail stock management, dynamic expiry pricing, and point-of-sale optimization platform.

---

## Live Demo

- **Live Application (Frontend):** [https://optistock-kappa.vercel.app/](https://optistock-kappa.vercel.app/)
- **API Service (Backend):** [https://optistock-backend-syu1.onrender.com](https://optistock-backend-syu1.onrender.com)
- **Health Check:** [https://optistock-backend-syu1.onrender.com/health](https://optistock-backend-syu1.onrender.com/health)

### Demo Credentials
| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Manager** | `manager@optistock.com` | `manager123` | Executive dashboard, analytics, forecasting, 80-20 mix, reorders |
| **Cashier** | `cashier@optistock.com` | `cashier123` | Spatial POS billing, shelf search, discount authorization requests |

---

## Overview & Problem Statement

Retail grocery and convenience stores encounter severe operational profit leaks due to two primary challenges:
1. **Perishable Shrinkage & Expiry Waste:** Manual shelf tracking leads to expired stock being thrown away at 100% loss rather than discounted early enough to recover cost.
2. **Margin Erosion & Stockouts:** Unchecked cashier discounting compromises minimum gross margins, while inaccurate manual reordering leads to high-demand stockouts and overstocking of slow-moving inventory.

**OptiStock AI** resolves these challenges by uniting Point of Sale (POS) operations with an automated inventory optimization engine. It continuously calculates days-to-expiry with dynamic automated markdowns, enforces minimum profit margin guardrails, provides weighted moving average (WMA) demand forecasting, and analyzes brand profitability using the 80/20 Pareto principle.

---

## Repository Structure

All backend and frontend application source code is consolidated inside the single main **`OptiStock`** directory:

```
optistock/
├── OptiStock/                         # Main project folder
│   ├── optistock-backend/             # Spring Boot 3.3.4 (Java 17+) backend
│   │   ├── src/
│   │   │   ├── main/java/com/optistock/
│   │   │   │   ├── config/            # Clock, Security, and DemoDataSeeder
│   │   │   │   ├── controller/        # REST endpoints (Manager, Bill, Stock, etc.)
│   │   │   │   ├── dto/               # Request & response data transfer objects
│   │   │   │   ├── entity/            # JPA entities (Product, Bill, PurchaseOrder, etc.)
│   │   │   │   ├── repository/        # Spring Data JPA repositories
│   │   │   │   └── service/           # Business logic & forecasting algorithms
│   │   │   └── main/resources/        # Application properties & configs
│   │   ├── pom.xml                    # Maven build file
│   │   └── .env.example               # Backend environment variables template
│   │
│   ├── optistock-frontend/            # React 19 + Vite frontend
│   │   ├── src/
│   │   │   ├── components/            # Cashier and Manager UI components
│   │   │   │   ├── cashier/           # Cashier billing, cart, and receipt modals
│   │   │   │   └── manager/           # Executive dashboard, alerts, forecast, ledger
│   │   │   ├── context/               # Global state (ReorderContext, Auth)
│   │   │   ├── pages/                 # ManagerDashboard and CashierDashboard views
│   │   │   └── styles/                # CSS design system and tokens
│   │   ├── tests/                     # Playwright E2E test suites (manager & cashier)
│   │   ├── package.json
│   │   └── vite.config.js
│   └── README.md
├── .env.example                       # Root environment configuration template
├── .gitignore                         # Comprehensive ignore rules
├── LICENSE                            # MIT License
└── README.md                          # Documentation
```

---

## Screenshots

> *Add application screenshots and demo captures below:*

| Manager Executive Dashboard | Spatial Cashier POS |
| :---: | :---: |
| *(Insert Screenshot of Executive Dashboard)* | *(Insert Screenshot of Cashier Billing Terminal)* |

| Demand Forecast & Recharts Analytics | 80/20 Mix Profit Optimizer |
| :---: | :---: |
| *(Insert Screenshot of Demand Forecasting)* | *(Insert Screenshot of 80/20 Brand Comparison)* |

---

## Key Features

### 1. Smart Stock Tracking & Double-Entry Ledger
- **Complete Movement Audit:** Tracks every stock modification (`SALE`, `PURCHASE`, `CANCEL_RESTORE`, `ADJUSTMENT`, `WRITE_OFF`) with timestamps, quantities, and reference IDs.
- **Product Catalog Management:** Add, edit, catalog-search, and safely soft-delete (archive) products without breaking historical transaction ledger integrity.

### 2. Automated Dynamic Expiry Markdown Engine
- **Clock-Consistent Rules (Asia/Kolkata):**
  - **Expired (< 0 days):** Sale strictly locked out with `400 Bad Request`.
  - **Last Day (0 days remaining):** 70% automatic promotional clearance markdown.
  - **1 to 2 Days Remaining:** 50% automatic markdown.
  - **3 to 4 Days Remaining:** Flagged for shelf front-rotation at regular price.
  - **5+ Days / Non-perishable:** Standard shelf price.
- **Expiry Guard on Restock:** Receiving purchase orders requires batch expiry dates for perishable items to maintain continuous tracking.

### 3. Profit Margin Guardrail & Cashier Approval Flow
- **10% Minimum Margin Protection:** Rejects arbitrary manual discounts that breach minimum gross profit with `409 Conflict`.
- **Digital Override Workflow:** Cashiers can submit discount authorization requests with custom reasons; managers review, approve, or reject them in real time from their dashboard.

### 4. Predictive Demand Forecasting (WMA Engine)
- **Weighted Moving Average (WMA):** Prioritizes recent momentum (recent 7 days weighted 2x, days 8-30 weighted 1x).
- **30-Day Projections:** Computes estimated daily burn rate, total monthly demand, and days of cover.
- **Perishable-Aware Reorder Caps:** Automatic reorder recommendations capped at product shelf life to prevent over-ordering perishables.
- **Interactive Analytics:** Recharts historical demand curves, forecast trajectories, and 95% confidence intervals with CSV export.

### 5. 80/20 Brand Mix Profit Optimizer
- **Pareto Principle Analytics:** Identifies high-margin vs high-volume product types (e.g., Amul vs Milky Mist).
- **Automated Rebalancing Suggestions:** Provides data-driven recommendations on product distribution to maximize net profit.
- **One-Click Mix Ordering:** Triggers multi-product purchase orders calculated according to recommended brand ratios.

### 6. Unified Purchase Order & Reorder System
- **Centralized Reorder Architecture:** Modal dialog accessible across Low Stock Alerts, Stock Ledger, Demand Forecast, and the Pareto Mix page.
- **Status Lifecycle:** Tracks purchase orders through `SUGGESTED`, `ORDERED`, `IN_TRANSIT`, `RECEIVED`, and `CANCELLED`.
- **Supplier Directory:** Integrated vendor contacts, WhatsApp order links, and instant supplier creation.

### 7. Dual-Role Authentication & Security
- **Role-Based Access Control (RBAC):** Distinct dashboards and capabilities for `MANAGER` and `CASHIER`.
- **Stateless Bearer Tokens & BCrypt:** Cryptographically secure password hashing and rate-limited authentication endpoints.

---

## Tech Stack

### Backend
- **Language:** Java 17+ (LTS)
- **Framework:** Spring Boot 3.3.4 (Spring MVC, Spring Data JPA, Spring Security 6)
- **Database:**
  - Production: MySQL 8 (externalized connection pool via environment variables)
  - Demo / Tests: In-Memory H2 with MySQL syntax compatibility mode
- **Build Tool:** Apache Maven 3.9+
- **Testing:** JUnit 5, Mockito, Spring Boot Test

### Frontend
- **Framework:** React 19 + Vite
- **Data Visualization:** Recharts
- **Iconography:** Lucide React
- **Styling:** Custom Design System (Dark Slate/Teal Manager Dashboard, Neutral Spatial Cashier POS)
- **E2E Testing:** Playwright

---

## Getting Started

### Prerequisites
- **Java Development Kit (JDK):** Version 17 or higher
- **Node.js:** Version 18 or higher (with npm)
- **Maven:** Version 3.8+
- *(Optional for Production)*: **MySQL Server 8.0+**

---

### Quick Start (Demo Mode)

OptiStock includes a standalone zero-config demo mode pre-seeded with 40+ products, suppliers, 30 days of sales history, and test user accounts.

#### 1. Start the Backend Server
```bash
cd OptiStock/optistock-backend
mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
```
The Spring Boot backend will start on `http://localhost:8080`.

#### 2. Start the Frontend Application
```bash
# In a separate terminal:
cd OptiStock/optistock-frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### Demo User Accounts

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Manager** | `manager@optistock.com` | `manager123` | Full analytics, forecasting, 80/20 mix, purchase orders, catalog management |
| **Cashier** | `cashier@optistock.com` | `cashier123` | Quick barcode/shelf POS billing, receipts, discount requests |

---

### Production Deployment (MySQL)

1. Create a MySQL database:
   ```sql
   CREATE DATABASE optistock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Copy `.env.example` to `.env` and configure your credentials:
   ```bash
   cp .env.example .env
   ```
3. Set environment variables:
   ```bash
   export DB_URL="jdbc:mysql://localhost:3306/optistock?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true"
   export DB_USERNAME="your_mysql_user"
   export DB_PASSWORD="your_mysql_password"
   export SPRING_PROFILES_ACTIVE="default"
   ```
4. Run the production backend:
   ```bash
   cd OptiStock/optistock-backend
   mvn clean spring-boot:run
   ```
5. Build the frontend for production:
   ```bash
   cd OptiStock/optistock-frontend
   npm run build
   ```

---

## Running Tests

### Backend Unit & Integration Tests (JUnit 5)
```bash
cd OptiStock/optistock-backend
mvn test
```
*Executes all 38 test suites across billing, markdown rules, demand forecasting, stock movements, and clock consistency.*

### Frontend End-to-End Tests (Playwright)
```bash
cd OptiStock/optistock-frontend
npx playwright test
```
*Validates full manager and cashier interactive user journeys, hit-testing, and state persistence.*

---

## Future Scope & Roadmap

- [ ] **Barcode & QR Scanner Hardware Integration:** Direct USB and camera-based barcode scanning for rapid checkout.
- [ ] **Multi-Branch & Warehouse Synchronization:** Centralized inventory tracking across multiple retail store outlets.
- [ ] **AI-Powered Seasonal Trend Detection:** Enhanced machine learning models incorporating holidays, weather patterns, and local festivities into reorder suggestions.
- [ ] **Supplier EDI / Automated Email Invoicing:** Automated purchase order PDF transmission directly to suppliers upon approval.
- [ ] **Customer Loyalty & SMS Digital Receipts:** Paperless checkout with customer transaction history and loyalty points.

---

## License

This project is licensed under the [MIT License](LICENSE).
