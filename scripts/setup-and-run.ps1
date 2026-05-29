$ErrorActionPreference = "Stop"

$rootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendJob = $null
$frontendJob = $null

function Import-DotEnv {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return
    }

    Write-Host "A carregar $Path"
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()

        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }

        $key, $value = $line.Split("=", 2)
        $key = $key.Trim()
        $value = $value.Trim().Trim('"').Trim("'")

        if ($key) {
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

try {
    Set-Location $rootDir

    Import-DotEnv (Join-Path $rootDir ".env")
    Import-DotEnv (Join-Path $rootDir "backend/.env")

    Write-Host "A instalar dependencias do frontend..."
    npm install

    Write-Host "A arrancar backend em http://localhost:8080"
    $backendJob = Start-Job -Name "checkpoint-backend" -ScriptBlock {
        param($root)
        Set-Location (Join-Path $root "backend")
        .\mvnw.cmd spring-boot:run
    } -ArgumentList $rootDir

    Write-Host "A arrancar frontend em http://localhost:5173"
    $frontendJob = Start-Job -Name "checkpoint-frontend" -ScriptBlock {
        param($root)
        Set-Location $root
        npm run dev
    } -ArgumentList $rootDir

    Write-Host ""
    Write-Host "Tudo a correr:"
    Write-Host "  Frontend: http://localhost:5173"
    Write-Host "  Backend:  http://localhost:8080"
    Write-Host "  Swagger:  http://localhost:8080/swagger-ui.html"
    Write-Host ""
    Write-Host "Prime Ctrl+C para parar tudo."

    while ($true) {
        Receive-Job $backendJob, $frontendJob

        $finished = @($backendJob, $frontendJob) | Where-Object {
            $_.State -in @("Completed", "Failed", "Stopped")
        }

        if ($finished.Count -gt 0) {
            break
        }

        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "A parar frontend e backend..."

    if ($frontendJob) {
        Stop-Job $frontendJob -ErrorAction SilentlyContinue
        Remove-Job $frontendJob -Force -ErrorAction SilentlyContinue
    }

    if ($backendJob) {
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -Force -ErrorAction SilentlyContinue
    }
}
