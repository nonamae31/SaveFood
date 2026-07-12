Set-Location "d:\blackmyth\folder3\session8\prn232\project\SaveFood\SaveFoodBackend"
Start-Process -FilePath "dotnet" -ArgumentList "bin\Debug\net8.0\SaveFoodBackend.dll --urls http://localhost:5001" -WindowStyle Hidden
