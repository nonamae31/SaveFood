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

$complaintBody = @{
    storeId = "21000000-0000-0000-0000-000000000001"
    orderId = "D421055D-F115-4012-9C98-218046EA732F"
    title = "Broken product"
    description = "Product is broken completely"
    type = 0
} | ConvertTo-Json

try {
    $compResponse = Invoke-RestMethod -Uri "https://localhost:7251/api/v1/customer/complaints" -Method Post -Body $complaintBody -ContentType "application/json; charset=utf-8" -Headers @{ "Authorization" = "Bearer $token" }
    Write-Output "Success:"
    $compResponse | ConvertTo-Json -Depth 5
} catch [System.Net.WebException] {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $responseBody = $reader.ReadToEnd()
    Write-Output "400 Error Body: $responseBody"
}
