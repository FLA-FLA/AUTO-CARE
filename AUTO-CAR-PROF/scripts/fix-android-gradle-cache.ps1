$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$gradleHome = Join-Path $projectRoot '.g'
$gradleWrapper = Join-Path $projectRoot 'android\gradlew.bat'
$nodeModules = Join-Path $projectRoot 'node_modules'

if (-not (Test-Path -LiteralPath $gradleWrapper -PathType Leaf)) {
    throw "Gradle wrapper nao encontrado: $gradleWrapper"
}

# Expo inherits this path, and gradlew.bat also selects it when launched directly.
$env:GRADLE_USER_HOME = $gradleHome
Write-Host "Usando cache Gradle curto: $gradleHome"

# Stop daemons from this cache and discard generated CMake/Ninja directories
# that can retain the previous, long Gradle cache path.
& $gradleWrapper --stop
$cmakeCaches = @()
$appCmakeCache = Join-Path $projectRoot 'android\app\.cxx'
if (Test-Path -LiteralPath $appCmakeCache -PathType Container) {
    $cmakeCaches += Get-Item -LiteralPath $appCmakeCache
}
$cmakeCaches += Get-ChildItem -LiteralPath $nodeModules -Directory -Filter '.cxx' -Recurse -ErrorAction SilentlyContinue

foreach ($cache in ($cmakeCaches | Sort-Object FullName -Descending -Unique)) {
    Remove-Item -LiteralPath $cache.FullName -Recurse -Force
    Write-Host "Cache CMake removido: $($cache.FullName)"
}

Write-Host 'Caches CMake antigos removidos. Agora rode: npx expo run:android'
