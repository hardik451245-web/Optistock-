# OptiStock - Retail Inventory and Billing Platform

OptiStock is a retail point of sale (POS) and inventory optimization system engineered to track stock movements, automate expiry markdowns, safeguard profit margins, and deliver predictive demand analytics.

## Tech Stack

### Backend
- Java: 17+ (tested with Java 17 and Java 26)
- Framework: Spring Boot 3.3.4 (REST, Data JPA, Security)
- Security: Spring Security 6 with BCrypt password hashing, in-memory stateless Bearer Token authentication, and login rate limiting
- Database:
  - Production: MySQL 8 (configured via environment variables)
  - Demo and Testing: In-memory H2 with MySQL compatibility mode
- Build Tool: Apache Maven 3.9+

### Frontend
- Framework: React 19 + Vite
- Icons: Lucide React
- Charts and Visualizations: Recharts
- Styling: Vanilla CSS with custom tokens (Manager dark slate/teal glassmorphism, Cashier light neutral spatial POS)

## Quick Start (Demo Mode)

OptiStock includes a demo mode that starts with an in-memory database pre-seeded with:
- Default MANAGER and CASHIER accounts
- 40 retail products across 8 categories
- 30 days of realistic sales transactions and stock movement ledger history

### 1. Start the Backend
From the root directory:
```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
```
The REST API starts at `http://localhost:8080`.

### 2. Start the Frontend
In a separate terminal:
```bash
cd optistock-frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## Default Credentials (Demo Profile)

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| Manager | manager@optistock.com | manager123 | Full dashboard, stock ledger, reorders, forecasting, approvals |
| Cashier | cashier@optistock.com | cashier123 | Point of sale billing, shelf search, discount authorization requests |

## Production Setup

To connect to a live MySQL 8 instance:
1. Ensure MySQL is running on port 3306.
2. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS optistock;
   ```
3. Set environment variables:
   ```bash
   export DB_URL="jdbc:mysql://localhost:3306/optistock?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true"
   export DB_USERNAME="root"
   export DB_PASSWORD="your_mysql_password"
   export OPTISTOCK_MANAGER_CODE="your_manager_registration_code"
   export CORS_ALLOWED_ORIGINS="https://app.yourdomain.com"
   ```
4. Run the backend without the demo profile:
   ```bash
   mvn spring-boot:run
   ```

## Core Features

### 1. Dynamic Expiry Markdown Engine (ExpiryPricingService)
- Automated discount calculation based on shelf life remaining (Asia/Kolkata timezone):
  - EXPIRED (< 0 days): Sale strictly prohibited (returns 400 Bad Request).
  - LAST DAY (0 days left): 70% automatic markdown.
  - MARKDOWN (1 to 2 days left): 50% automatic markdown.
  - EXPIRING SOON (3 to 4 days left): Flagged for rotation at standard price.
  - NORMAL (5+ days or no expiry): Standard shelf price.

### 2. Profit Margin Guardrails (BillService)
- Protects store margins (configured at 10% minimum margin).
- If a cashier enters a manual discount that breaches the threshold, the system rejects the transaction with 409 Conflict.
- Cashiers submit an electronic discount request that managers review and approve directly from their dashboard.

### 3. Stock and Reorder Flow (PurchaseOrderService and StockService)
- Complete stock movement ledger tracking SALE, PURCHASE, CANCEL_RESTORE, ADJUSTMENT, and WRITE_OFF types.
- Purchase orders workflow: ORDERED, RECEIVED, CANCELLED.
- Perishables safety: new batch expiry date required on receipt.
- Soft delete / archiving: deactivated products are preserved in historical ledger while hidden from active shelves and billing.

### 4. Predictive Demand Forecasting (ManagerService)
- Weighted Moving Average (WMA): Most recent 7 days count double, days 8 to 30 count single.
- 30-Day Demand Forecast: ceil(AvgDailySales * 30).
- Days of Cover: Current Stock / AvgDailySales.
- Suggested Reorder Quantity: max(0, ceil(Forecast30 * 1.10) - Stock - OnOrder), capped for perishables.

## Testing

Run backend JUnit test suite (32 unit and integration tests):
```bash
mvn test
```

Run frontend production build:
```bash
cd optistock-frontend
npm run build
```
