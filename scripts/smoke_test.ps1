# OptiStock AI Smoke Test Script
$baseUrl = "http://localhost:8080"
$ErrorActionPreference = "Stop"

function Make-Request {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Token,
        [string]$Body
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    $params = @{
        Uri = "$baseUrl$Path"
        Method = $Method
        Headers = $headers
    }
    if ($Body) {
        $params["Body"] = $Body
    }

    try {
        $resp = Invoke-WebRequest -UseBasicParsing @params
        return [PSCustomObject]@{
            StatusCode = [int]$resp.StatusCode
            Content = $resp.Content
        }
    } catch {
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errContent = $reader.ReadToEnd()
            return [PSCustomObject]@{
                StatusCode = [int]$_.Exception.Response.StatusCode
                Content = $errContent
            }
        } else {
            throw $_
        }
    }
}

Write-Host "--- 1. Testing Manager Login ---"
$mgrLogin = Make-Request -Method "POST" -Path "/api/users/login" -Body '{"email":"manager@optistock.com","password":"manager123"}'
Write-Host "Manager Login Status: $($mgrLogin.StatusCode)"
if ($mgrLogin.StatusCode -ne 200) { throw "Manager login failed!" }
$mgrData = $mgrLogin.Content | ConvertFrom-Json
$mgrToken = $mgrData.token
Write-Host "Manager Token received: $($mgrToken.Substring(0, 10))..."

Write-Host "`n--- 2. Testing Cashier Login ---"
$cshLogin = Make-Request -Method "POST" -Path "/api/users/login" -Body '{"email":"cashier@optistock.com","password":"cashier123"}'
Write-Host "Cashier Login Status: $($cshLogin.StatusCode)"
if ($cshLogin.StatusCode -ne 200) { throw "Cashier login failed!" }
$cshData = $cshLogin.Content | ConvertFrom-Json
$cshToken = $cshData.token
Write-Host "Cashier Token received: $($cshToken.Substring(0, 10))..."

Write-Host "`n--- 3. Testing GET /api/products ---"
$prodsResp = Make-Request -Method "GET" -Path "/api/products" -Token $mgrToken
Write-Host "Products Status: $($prodsResp.StatusCode)"
$products = $prodsResp.Content | ConvertFrom-Json
Write-Host "Total products fetched: $($products.Count)"

Write-Host "`n--- 4. Testing Manager Analytics Endpoints ---"
$forecastResp = Make-Request -Method "GET" -Path "/api/manager/forecast" -Token $mgrToken
Write-Host "GET /api/manager/forecast: $($forecastResp.StatusCode)"
if ($forecastResp.StatusCode -ne 200) { throw "Forecast failed" }

$alertsResp = Make-Request -Method "GET" -Path "/api/manager/alerts" -Token $mgrToken
Write-Host "GET /api/manager/alerts: $($alertsResp.StatusCode)"
if ($alertsResp.StatusCode -ne 200) { throw "Alerts failed" }

$summaryResp = Make-Request -Method "GET" -Path "/api/manager/summary" -Token $mgrToken
Write-Host "GET /api/manager/summary: $($summaryResp.StatusCode)"
if ($summaryResp.StatusCode -ne 200) { throw "Summary failed" }

$rankingResp = Make-Request -Method "GET" -Path "/api/manager/ranking" -Token $mgrToken
Write-Host "GET /api/manager/ranking: $($rankingResp.StatusCode)"
if ($rankingResp.StatusCode -ne 200) { throw "Ranking failed" }

$mixResp = Make-Request -Method "GET" -Path "/api/manager/product-mix" -Token $mgrToken
Write-Host "GET /api/manager/product-mix: $($mixResp.StatusCode)"
if ($mixResp.StatusCode -ne 200) { throw "Product mix failed" }

Write-Host "`n--- 5. Security Checks: Cashier 403 on Restricted Endpoints ---"
$postProdResp = Make-Request -Method "POST" -Path "/api/products" -Token $cshToken -Body '{"name":"Hacked","category":"Snacks","costPrice":10,"sellingPrice":20,"stockQuantity":10}'
Write-Host "Cashier POST /api/products: $($postProdResp.StatusCode) (Expected 403)"
if ($postProdResp.StatusCode -ne 403) { throw "Expected 403 on Cashier POST /api/products!" }

$mgrRestrictedResp = Make-Request -Method "GET" -Path "/api/manager/summary" -Token $cshToken
Write-Host "Cashier GET /api/manager/summary: $($mgrRestrictedResp.StatusCode) (Expected 403)"
if ($mgrRestrictedResp.StatusCode -ne 403) { throw "Expected 403 on Cashier GET /api/manager/**!" }

Write-Host "`n--- 6. Business Logic: Expired Product Rejection (400) ---"
$expiredProd = $products | Where-Object { $_.expiryStatus -eq "EXPIRED" } | Select-Object -First 1
if (-not $expiredProd) {
    Write-Host "Searching products for expired item..."
    $expiredProd = $products | Where-Object { $_.name -like "*Dahi*" } | Select-Object -First 1
}
Write-Host "Found expired product: ID $($expiredProd.id) - $($expiredProd.name)"
$expiredBillBody = '{"items":[{"productId":' + $expiredProd.id + ',"quantity":1}]}'
$expiredBillResp = Make-Request -Method "POST" -Path "/api/bills" -Token $cshToken -Body $expiredBillBody
Write-Host "POST /api/bills with expired product: $($expiredBillResp.StatusCode) (Expected 400)"
Write-Host "Response error message: $($expiredBillResp.Content)"
if ($expiredBillResp.StatusCode -ne 400) { throw "Expected 400 for expired product in bill!" }

Write-Host "`n--- 7. Business Logic: 1-2 Days Left (50% Discount) ---"
$markdownProd = $products | Where-Object { $_.expiryStatus -eq "MARKDOWN" } | Select-Object -First 1
if (-not $markdownProd) {
    $markdownProd = $products | Where-Object { $_.name -like "*Brown Bread*" -or $_.name -like "*Multigrain*" -or $_.name -like "*Taaza Milk*" } | Select-Object -First 1
}
Write-Host "Found 1-2 days left product: ID $($markdownProd.id) - $($markdownProd.name), Base: $($markdownProd.sellingPrice), DaysLeft: $($markdownProd.daysLeft)"
$markdownBillBody = '{"items":[{"productId":' + $markdownProd.id + ',"quantity":1}]}'
$markdownBillResp = Make-Request -Method "POST" -Path "/api/bills" -Token $cshToken -Body $markdownBillBody
Write-Host "POST /api/bills with markdown product: $($markdownBillResp.StatusCode) (Expected 201)"
if ($markdownBillResp.StatusCode -ne 201) { throw "Expected 201 for markdown product bill!" }
$billJson = $markdownBillResp.Content | ConvertFrom-Json
$item = $billJson.items[0]
Write-Host "Billed Item Price: $($item.price), Original: $($item.originalPrice), Discount: $($item.discountPercent)%, Reason: $($item.discountReason)"
if ([double]$item.discountPercent -ne 50.0) { throw "Expected 50% discount but got $($item.discountPercent)%" }

Write-Host "`nALL SMOKE TEST CHECKS PASSED SUCCESSFULLY!"
