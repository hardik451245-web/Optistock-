#!/usr/bin/env bash
set -e

BASE_URL="http://localhost:8080"
echo "=== OptiStock Smoke Test ==="

# 1. Register a new cashier
NEW_EMAIL="smoke_cashier_$(date +%s)@optistock.com"
REG_PASS="SmokeCashier123"

echo "[1] Registering new cashier: $NEW_EMAIL"
REG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Cashier\",\"email\":\"$NEW_EMAIL\",\"password\":\"$REG_PASS\",\"role\":\"CASHIER\"}")
echo "Registration status: $REG_STATUS"

# 2. Duplicate registration in different case must return 409
DUP_EMAIL=$(echo "$NEW_EMAIL" | tr '[:lower:]' '[:upper:]')
echo "[2] Duplicate registration check ($DUP_EMAIL)"
DUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Duplicate Cashier\",\"email\":\"$DUP_EMAIL\",\"password\":\"$REG_PASS\",\"role\":\"CASHIER\"}")
echo "Duplicate email status: $DUP_STATUS"

# 3. Wrong password login must return 401
echo "[3] Wrong password login attempt"
WRONG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$NEW_EMAIL\",\"password\":\"WrongPassword1\"}")
echo "Wrong password status: $WRONG_STATUS"

# 4. Login with newly registered cashier
echo "[4] Logging in with new cashier"
NEW_LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$NEW_EMAIL\",\"password\":\"$REG_PASS\"}")
NEW_TOKEN=$(echo "$NEW_LOGIN_RESP" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$NEW_TOKEN" ]; then
  echo "New cashier login: 200 OK (token received)"
else
  echo "New cashier login failed: $NEW_LOGIN_RESP"
fi

# 5. Login as seeded cashier
echo "[5] Logging in as seeded cashier"
SEEDED_LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"cashier@optistock.com\",\"password\":\"cashier123\"}")
CASHIER_TOKEN=$(echo "$SEEDED_LOGIN_RESP" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$CASHIER_TOKEN" ]; then
  echo "Seeded cashier login: 200 OK (token received)"
else
  echo "Seeded cashier login failed: $SEEDED_LOGIN_RESP"
  CASHIER_TOKEN="$NEW_TOKEN"
fi

# 6. Call every endpoint cashier dashboard uses
echo "[6] Testing cashier dashboard endpoints"

# 6a. GET /api/products
PROD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CASHIER_TOKEN" "$BASE_URL/api/products")
echo "GET /api/products status: $PROD_STATUS"

# 6b. GET /api/products/1/alternatives
ALT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CASHIER_TOKEN" "$BASE_URL/api/products/1/alternatives")
echo "GET /api/products/1/alternatives status: $ALT_STATUS"

# 6c. POST /api/discount-requests
DISC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/discount-requests" \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":1,\"requestedPercent\":15}")
echo "POST /api/discount-requests status: $DISC_STATUS"

# 6d. POST /api/bills
BILL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/bills" \
  -H "Authorization: Bearer $CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"productId\":4,\"quantity\":1}]}")
echo "POST /api/bills status: $BILL_STATUS"

# 6e. GET /api/bills
BILLS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CASHIER_TOKEN" "$BASE_URL/api/bills")
echo "GET /api/bills status: $BILLS_STATUS"

# 7. Cashier role guard verification: cashier must get 403 on manager-only endpoints
echo "[7] Role guard verification (cashier token on manager endpoints)"
PO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CASHIER_TOKEN" "$BASE_URL/api/purchase-orders")
echo "GET /api/purchase-orders status (expected 403): $PO_STATUS"

ALERTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CASHIER_TOKEN" "$BASE_URL/api/manager/alerts")
echo "GET /api/manager/alerts status (expected 403): $ALERTS_STATUS"

echo "=== Smoke Test Completed ==="
