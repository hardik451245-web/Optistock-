# End-to-End Operational Flow Verification

This document details the curl commands and automated verification steps for the complete OptiStock operational workflow.

## 1. Authentication and Registration Tests

### 1.1 Register Cashier Account
```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Cashier","email":"alex@store.com","password":"password123","role":"CASHIER"}'
```
Expected Status: `201 Created`
Response: `{"message":"User registered successfully"}`

### 1.2 Attempt Duplicate Email Registration
```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Duplicate","email":"ALEX@store.com","password":"password123","role":"CASHIER"}'
```
Expected Status: `409 Conflict`
Response: `{"error":"Email already in use"}`

### 1.3 Attempt Manager Registration Without Code
```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Unauthorized Manager","email":"badmgr@store.com","password":"password123","role":"MANAGER","managerCode":"invalid"}'
```
Expected Status: `400 Bad Request`
Response: `{"error":"Manager registration is disabled"}` (or `"Invalid manager code"`)

### 1.4 Failed Login with Incorrect Password
```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@store.com","password":"wrongpassword"}'
```
Expected Status: `401 Unauthorized`
Response: `{"error":"Invalid email or password"}`

### 1.5 Successful Cashier Login
```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@store.com","password":"password123"}'
```
Expected Status: `200 OK`
Extract bearer token as `$CASHIER_TOKEN`.

### 1.6 Successful Manager Login
```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@optistock.com","password":"manager123"}'
```
Expected Status: `200 OK`
Extract bearer token as `$MANAGER_TOKEN`.

---

## 2. Role-Based Access Control (RBAC) Verification

### 2.1 Cashier Prohibited from Purchase Orders
```bash
curl -X GET http://localhost:8080/api/purchase-orders \
  -H "Authorization: Bearer $CASHIER_TOKEN"
```
Expected Status: `403 Forbidden`
Response: `{"error":"Access denied"}`

---

## 3. Stock, Reorder and Billing Lifecycle

### 3.1 Manager Orders Stock for Low-Stock Product
```bash
curl -X POST http://localhost:8080/api/purchase-orders \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":25,"supplier":"Fresh Agro Suppliers"}'
```
Expected Status: `201 Created`
Returns purchase order with status `ORDERED`.

### 3.2 Product Shows onOrderQuantity
```bash
curl -X GET http://localhost:8080/api/products/1 \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```
Expected Status: `200 OK`
Response contains `"onOrderQuantity": 25`.

### 3.3 Manager Receives Purchase Order
```bash
curl -X PUT http://localhost:8080/api/purchase-orders/1/receive \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receivedQuantity":25}'
```
Expected Status: `200 OK`
Stock quantity is incremented by 25. A `PURCHASE` movement is written to the stock ledger. Status changes to `RECEIVED`.

### 3.4 Verify PURCHASE Stock Movement in Ledger
```bash
curl -X GET "http://localhost:8080/api/stock/movements?productId=1&type=PURCHASE" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```
Expected Status: `200 OK`
Returns stock movement entry with `quantityChange: 25`, `type: "PURCHASE"`.

### 3.5 Cashier Views Updated Stock and Creates Bill
```bash
curl -X POST http://localhost:8080/api/bills \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":5}]}'
```
Expected Status: `201 Created`
Bill created with bill ID. Product stock decreases by 5. A `SALE` movement (-5) is written.

### 3.6 Verify SALE Stock Movement in Ledger
```bash
curl -X GET "http://localhost:8080/api/stock/movements?productId=1&type=SALE" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```
Expected Status: `200 OK`
Returns entry with `quantityChange: -5`, `type: "SALE"`.

### 3.7 Manager Cancels the Bill
```bash
curl -X PUT http://localhost:8080/api/bills/1/cancel \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```
Expected Status: `200 OK`
Bill status set to `CANCELLED`. Stock restored by +5. A `CANCEL_RESTORE` movement (+5) is recorded in the stock ledger.
