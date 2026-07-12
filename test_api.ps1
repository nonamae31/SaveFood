[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$body = @{
    email = "trantrunghieu31k@gmail.com"
    password = "123456"
} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "https://localhost:7251/api/users/login" -Method Post -Body $body -ContentType "application/json"

$token = ""
if ($response.token) { $token = $response.token }
elseif ($response.data.token) { $token = $response.data.token }
elseif ($response.data.accessToken) { $token = $response.data.accessToken }
elseif ($response.accessToken) { $token = $response.accessToken }

Write-Output "Token found. Calling Complaint API..."

$complaintBody = @{
    orderId = "e5700000-0000-0000-0000-000000000001"
    title = "S?n ph?m hu h?ng n?ng"
    description = "Giao hàng b? nát h?t bánh mì, yêu c?u gi?i quy?t"
    type = "ProductQuality"
} | ConvertTo-Json

try {
    $compResponse = Invoke-RestMethod -Uri "https://localhost:7251/api/v1/customer/complaints" -Method Post -Body $complaintBody -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $token" }
    Write-Output "Complaint API Response:"
    $compResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Output "Error calling Complaint API: $($_.Exception.Message)"
    Write-Output "Details: $($_.ErrorDetails.Message)"
}
