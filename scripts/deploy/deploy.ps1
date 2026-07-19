Write-Host "Setting up isolated Firebase configuration..."
$isolatedConfigPath = "$PSScriptRoot\.firebase-config"
if (!(Test-Path -Path $isolatedConfigPath)) {
    New-Item -ItemType Directory -Path $isolatedConfigPath -Force | Out-Null
}

# Set XDG_CONFIG_HOME so Firebase CLI uses the isolated config folder
$env:XDG_CONFIG_HOME = $isolatedConfigPath

# Ensure Node is in the PATH
$localNodePath = Resolve-Path "$PSScriptRoot\..\..\node-v20.12.2-win-x64" | Select-Object -ExpandProperty Path
if (Test-Path -Path $localNodePath) {
    $env:PATH = "$localNodePath;$env:PATH"
}

# Define the absolute path to the pure NodeJS Firebase CLI (bypassing the buggy firepit .exe)
$firebaseCli = "$localNodePath\node_modules\firebase-tools\lib\bin\firebase.js"

Write-Host "Checking Firebase authentication..."
# Test if we have a valid token
$authTest = node $firebaseCli projects:list 2>&1
if ($authTest -match "Failed to authenticate" -or $authTest -match "Unexpected end of JSON input") {
    Write-Host "`n[!] You are not authenticated." -ForegroundColor Yellow
    Write-Host "Opening browser to log in securely to Firebase..." -ForegroundColor Cyan
    node $firebaseCli login
} else {
    Write-Host "[*] Authentication verified!" -ForegroundColor Green
}

Write-Host "`nBuilding the Web App..." -ForegroundColor Cyan
cd frontend
npm run build

Write-Host "`nDeploying to Firebase Hosting..." -ForegroundColor Cyan
node $firebaseCli deploy --only hosting

Write-Host "`nDeployment Complete!" -ForegroundColor Green
cd ..
