[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
$phones = @("0990123402", "0934567803", "0978901203", "0945678904", "0395440731", "0395440752", "0987654321", "0395440799", "0901000001", "0395440758", "0123456789")

foreach ($phone in $phones) {
    $email = "testuser_$phone@gmail.com"
    $username = "user_$phone"
    $body = @{
        username = $username
        fullName = "Test User $phone"
        phoneNumber = $phone
        email = $email
        password = "Password123!"
    } | ConvertTo-Json

    Write-Host "Testing registration with phone: $phone"
    try {
        $response = Invoke-RestMethod -Uri "https://localhost:7251/api/Users/register" -Method Post -Body $body -ContentType "application/json"
        Write-Host "SUCCESS: $($response.message)" -ForegroundColor Green
    } catch {
        Write-Host "FAILED for phone $phone : $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}
