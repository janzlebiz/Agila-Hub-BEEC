$ErrorActionPreference = "Stop"

$openssl = "C:\Program Files\Git\usr\bin\openssl.exe"
if (-not (Test-Path $openssl)) {
    Write-Error "OpenSSL not found at $openssl"
    exit 1
}

$alias = "agila-hub-release"
$password = "AgilaHubBEEC2026Release!"
$keystoreFile = "agila-hub-release.keystore"
$keyFile = "temp_release.key"
$crtFile = "temp_release.crt"

Write-Host "1. Generating 2048-bit RSA Private Key..."
& $openssl genrsa -out $keyFile 2048

Write-Host "2. Generating X.509 Certificate (valid for 10,000 days / ~27 years)..."
& $openssl req -new -x509 -key $keyFile -out $crtFile -days 10000 `
  -subj "/CN=AGILA Hub/OU=BEEC/O=The Fraternal Order of Eagles/C=PH"

Write-Host "3. Packaging into PKCS#12 Release Keystore..."
& $openssl pkcs12 -export -in $crtFile -inkey $keyFile -out $keystoreFile `
  -name $alias -passout "pass:$password"

Write-Host "4. Extracting Certificate Fingerprints..."
$sha256Fingerprint = & $openssl x509 -in $crtFile -noout -fingerprint -sha256
$sha1Fingerprint = & $openssl x509 -in $crtFile -noout -fingerprint -sha1

# Remove temporary plain PEM files
Remove-Item -Force $keyFile, $crtFile

Write-Host "5. Converting Keystore to Base64..."
$base64Content = [Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path $keystoreFile)))

# Save Base64 string to a secure local file for easy retrieval
$base64File = "agila-hub-keystore-base64.txt"
[IO.File]::WriteAllText((Join-Path (Get-Location) $base64File), $base64Content)

Write-Host "=== GENERATION SUCCESSFUL ==="
Write-Host "Keystore File: $keystoreFile"
Write-Host "Alias: $alias"
Write-Host "Password: $password"
Write-Host "$sha256Fingerprint"
Write-Host "$sha1Fingerprint"
Write-Host "Base64 Length: $($base64Content.Length) characters"
