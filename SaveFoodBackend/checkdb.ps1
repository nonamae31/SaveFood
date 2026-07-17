$conn = New-Object System.Data.SqlClient.SqlConnection
$conn.ConnectionString = "Server=localhost\SQLEXPRESS;Database=SaveFoodDB_MVP;Trusted_Connection=True;TrustServerCertificate=True;"
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT name, create_date, modify_date FROM sys.tables"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Output ($reader["name"].ToString() + " - created: " + $reader["create_date"].ToString() + " - modified: " + $reader["modify_date"].ToString())
}
$reader.Close()
$conn.Close()