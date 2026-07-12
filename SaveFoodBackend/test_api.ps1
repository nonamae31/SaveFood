$ErrorActionPreference = "Continue"
[Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

Write-Host "--- LOGIN ---"
$loginBody = @{ email = "trantrunghieu31k@gmail.com"; password = "123456" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "https://localhost:7251/api/Users/login" -Method Post -Body $loginBody -ContentType "application/json"
$loginResponse | ConvertTo-Json -Depth 5
$token = $loginResponse.accessToken
if (-not $token) { $token = $loginResponse.token }
Write-Host "Token: $token"

Write-Host "--- PRESIGNED URL ---"
$presignedUrlBody = @{ fileName = "test_image.jpg"; folder = "complaints" } | ConvertTo-Json
try {
    $presignedUrlResponse = Invoke-RestMethod -Uri "https://localhost:7251/api/v1/customer/complaints/presigned-url" -Method Post -Body $presignedUrlBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    Write-Host "Presigned URL Response:"
    $presignedUrlResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error calling presigned-url: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host $reader.ReadToEnd()
    }
}

Write-Host "--- CREATE COMPLAINT ---"
$orderId = "d421055d-f115-4012-9c98-218046ea732f"
$connString = "Server=localhost;Database=SaveFoodDB_MVP;Trusted_Connection=True;TrustServerCertificate=True;"
$query = "SELECT StoreId FROM Orders WHERE Id = '$orderId'"
try {
    $storeId = (Invoke-Sqlcmd -ConnectionString $connString -Query $query).StoreId
} catch {
    Write-Host "Failed to query db: $_"
}

if (-not $storeId) {
    Write-Host "StoreId not found for order $orderId, using a random Guid"
    $storeId = [guid]::NewGuid().ToString()
}

Write-Host "Using StoreId: $storeId"

$complaintBody = @{
    storeId = "$storeId"
    orderId = "$orderId"
    title = "Test complaint"
    description = "This is a test complaint description."
    type = 1
    evidences = @(
        @{
            fileUrl = "https://example.com/image.jpg"
            fileType = "image/jpeg"
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $complaintResponse = Invoke-RestMethod -Uri "https://localhost:7251/api/v1/customer/complaints" -Method Post -Body $complaintBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    Write-Host "Create Complaint Response:"
    $complaintResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error calling Create Complaint: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host $reader.ReadToEnd()
    }
}
