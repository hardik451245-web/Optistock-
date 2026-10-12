# OptiStock Demonstration Walkthrough

This guide provides a step-by-step walkthrough to demonstrate the capabilities of OptiStock, from cashier operations to inventory analytics.

## Prerequisites

1. Start Backend with Demo Profile:
   ```bash
   mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
   ```
2. Start Frontend Dev Server:
   ```bash
   cd optistock-frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

## Demonstration Workflow

### Step 1: Login as Cashier (Spatial POS Interface)
- Action: Navigate to `http://localhost:5173`. On the login page, enter:
  - Email: `cashier@optistock.com`
  - Password: `cashier123`
- What to observe:
  - The application loads the Spatial POS interface.
  - Notice the three distinct floating panels:
    1. Left Panel ("Shelf"): Product browser with category filters and stock badges.
    2. Center Panel ("Bill"): Active cart with item quantities, discounts, and payable total.
    3. Right Panel ("Assistant"): Smart suggestions, out-of-stock alternatives, and active markdown specials.

### Step 2: Automated Expiry Markdown (1 to 2 Days Left = 50% Off)
- Action: In the Shelf panel, locate "Brown Bread" or "Taaza Milk" (items with 1 to 2 days until expiration). Click the product tile to add it to the bill.
- What to observe:
  - The item appears in the cart with an automatic 50% Markdown applied.
  - The original base price, discounted effective price, and markdown percentage are shown directly from the server.
  - Price calculations are performed entirely on the server.

### Step 3: Expired Product Sale Rejection (Safety Guardrail)
- Action: Locate "Classic Dahi" (Nestle Dahi, which has an expiry date in the past) in the Shelf panel and click the tile.
- What to observe:
  - The item displays an EXPIRED indicator and is dimmed.
  - If a bill submission is attempted containing an expired product, the backend rejects the request with HTTP 400 Bad Request:
    ```json
    { "error": "Product 14 (Classic Dahi) is expired and cannot be sold" }
    ```
  - The UI alerts the cashier with a warning message.

### Step 4: Margin Protection and Discount Approval Request
- Action:
  1. Add a standard product (e.g. "Basmati Rice") to the cart.
  2. In the item line, enter a heavy manual discount (e.g. 40%).
  3. Click "Pay and Bill".
- What to observe:
  - The system detects that the selling price falls below the wholesale cost plus minimum margin (10%).
  - The transaction is blocked with HTTP 409 Conflict.
  - The modal prompts the cashier to submit an electronic Discount Request to the store manager.
  - Submit the request and observe the real-time polling state.

### Step 5: Switch to Manager Dashboard
- Action: Click "Log out" in the top navigation, and sign in with manager credentials:
  - Email: `manager@optistock.com`
  - Password: `manager123`
- What to observe:
  - The interface loads the Manager Dashboard featuring the restrained dark slate and teal palette.
  - An indicator badge on the Approvals tab highlights the pending discount request submitted by the cashier in Step 4.

### Step 6: Review and Approve Discount Request
- Action: In the Manager Dashboard, navigate to the "Approvals" tab.
- What to observe:
  - Review the pending discount request with product details, requested percent, and cashier timestamp.
  - Click "Approve".
  - The status updates to APPROVED. The cashier can now complete the transaction using the approved reference ID.

### Step 7: Predictive Forecasting, Smart Reorders and Stock Management
- Action: Explore the manager analytics tabs:
  1. "Forecast" Tab:
     - View the Weighted Moving Average (WMA) daily sales calculation.
     - Note how products expiring soon have their suggestedReorderQty capped to prevent overstocking perishable goods before they spoil.
     - Click "Reorder" on a row to open the reorder dialog, or click "Reorder All Suggested".
  2. "Stock" Tab:
     - View Stock Levels, Purchase Orders, and Stock Movements.
     - In the Orders sub-view, click "Receive" to receive an order into active inventory.
  3. "Rankings & Mix" Tab:
     - Inspect the Pareto 80/20 category optimization breakdown and 30-day profit rankings.
