[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

# 1. Register with email 1 (with dot)
$body1 = @{
    username = "test_dot_user"
    fullName = "Test Dot User"
    phoneNumber = "0999999991"
    email = "test.email.with.dot@gmail.com"
    password = "Password123!"
} | ConvertTo-Json

Write-Host "Registering with dot email: test.email.with.dot@gmail.com"
try {
    $res1 = Invoke-RestMethod -Uri "https://localhost:7251/api/Users/register" -Method Post -Body $body1 -ContentType "application/json"
    Write-Host "SUCCESS: $($res1.message)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Register with email 2 (no dot) to overwrite
$body2 = @{
    username = "test_nodot_user"
    fullName = "Test No Dot User"
    phoneNumber = "0999999992"
    email = "testemailwithdot@gmail.com"
    password = "Password123!"
} | ConvertTo-Json

Write-Host "`nRegistering with NO dot email: testemailwithdot@gmail.com"
try {
    $res2 = Invoke-RestMethod -Uri "https://localhost:7251/api/Users/register" -Method Post -Body $body2 -ContentType "application/json"
    Write-Host "SUCCESS: $($res2.message)" -ForegroundColor Green
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Check DB to ensure it was overwritten
Write-Host "`nChecking DB directly for 'testemailwithdot@gmail.com'..."
$sql = "SELECT Email, NormalizedEmail FROM Users WHERE NormalizedEmail = 'testemailwithdot@gmail.com'"
sqlcmd -S localhost -d SaveFoodDB_MVP -Q $sql
