# Food Ordering Microservices - PowerShell Stop Script
# This script stops all running microservices

Write-Host "🛑 Stopping Food Ordering Microservices System" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Red

# Function to stop Node.js processes running on specific ports
function Stop-ServiceOnPort {
    param(
        [int]$Port,
        [string]$ServiceName
    )
    
    try { 
        # Find processes using the specific port
        $netstatOutput = netstat -ano | Select-String ":$Port "
        if ($netstatOutput) {
            $processIds = $netstatOutput | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -ne "0" }
            
            foreach ($processId in $processIds) {
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process -and $process.ProcessName -eq "node") {
                        Write-Host "🛑 Stopping $ServiceName Service (PID: $processId)" -ForegroundColor Yellow
                        Stop-Process -Id $pid -Force
                    }
                } catch {
                    # Process might already be stopped
                }
            }
        } else {
            Write-Host "⚠️  No process found on port $Port for $ServiceName" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Error checking port $Port for $ServiceName" -ForegroundColor Yellow
    }
}

# Stop all microservices
Write-Host "🔍 Stopping services..." -ForegroundColor Cyan

$services = @(
    @{Port=5001; Name="Order"},
    @{Port=5002; Name="Payment"},
    @{Port=5003; Name="Notification"},
    @{Port=5004; Name="Delivery"},
    @{Port=5005; Name="Inventory"},
    @{Port=5006; Name="Restaurant"}
)

foreach ($service in $services) {
    Stop-ServiceOnPort -Port $service.Port -ServiceName $service.Name
}

# Alternative method: Stop all Node.js processes (more aggressive)
Write-Host "🔍 Checking for any remaining Node.js processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "🛑 Found $($nodeProcesses.Count) Node.js process(es), stopping them..." -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "   Stopping PID: $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force
    }
} else {
    Write-Host "✅ No Node.js processes found" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ All services stopped" -ForegroundColor Green
Write-Host ""
Write-Host "🐳 Kafka is still running. To stop Kafka:" -ForegroundColor Yellow
Write-Host "   docker-compose down" -ForegroundColor White
Write-Host ""
Write-Host "🧹 To clean up everything (including Kafka):" -ForegroundColor Yellow
Write-Host "   docker-compose down -v" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
Read-Host
