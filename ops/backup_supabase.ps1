param(
  [Parameter(Mandatory = $true)]
  [string]$DbUrl,

  [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump no esta disponible en PATH. Instala PostgreSQL tools para poder generar backups."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$output = Join-Path $OutputDir "huellitas-$timestamp.dump"

pg_dump $DbUrl --format=custom --no-owner --no-acl --file=$output

Write-Host "Backup generado: $output"
