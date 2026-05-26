[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$body = @{
    username = "newuser_verify"
    fullName = "Test User Verify"
    phoneNumber = "0395440752"
    email = "newuser_verify@gmail.com"
    password = "Password123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://localhost:7251/api/Users/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "SUCCESS: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody" -ForegroundColor Red
}
