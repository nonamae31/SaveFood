[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$body = @{
    email = "trantrunghieu31k@gmail.com"
    password = "123456"
} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri "https://localhost:7251/api/users/login" -Method Post -Body $body -ContentType "application/json"
    Write-Output "Token: $($response.data.token)"
    Write-Output "Token Extracted Successfully"
} catch {
    Write-Output "Error: $($_.Exception.Message)"
    Write-Output "Details: $($_.ErrorDetails.Message)"
}
