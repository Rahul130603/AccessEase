$ErrorActionPreference = 'Stop'
$taskAdminName = Read-Host 'Admin username'
$taskAdminSecret = Read-Host 'Admin password (at least 10 characters)' -AsSecureString
$taskAdminPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskAdminSecret)
try {
    $taskAdminPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskAdminPointer)
    @{ username = $taskAdminName; password = $taskAdminPassword } | ConvertTo-Json -Compress | node "$PSScriptRoot/server/configure-admin.mjs"
    if ($LASTEXITCODE -ne 0) { throw 'Admin configuration failed.' }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskAdminPointer)
    $taskAdminPassword = $null
    $taskAdminSecret.Dispose()
}
