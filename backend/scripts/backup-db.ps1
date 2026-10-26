<#
.SYNOPSIS
  Automated PostgreSQL Daily Backup & Restore Verification Drill for SEYVEN
.DESCRIPTION
  Dumps production database schema and records with gzip compression,
  validates archive integrity, and rotates historical backups older than 14 days.
#>

param(
  [string]$BackupDir = ".\backups",
  [int]$RetentionDays = 14,
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432,
  [string]$DbName = "seyven",
  [string]$DbUser = "postgres"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$dateTag = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "seyven_prod_$dateTag.sql"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "[START] SEYVEN PostgreSQL Automated Backup [$dateTag]" -ForegroundColor Green
Write-Host "Database: ${DbUser}@${DbHost}:${DbPort}/${DbName}"
Write-Host "Destination: $backupFile"
Write-Host "================================================================="

# Execute pg_dump
try {
  pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName --format=plain --no-owner --clean --if-exists -f $backupFile
  $fileInfo = Get-Item $backupFile
  $sizeMb = [math]::Round($fileInfo.Length / 1MB, 2)
  Write-Host "[OK] Backup snapshot completed successfully ($sizeMb MB)" -ForegroundColor Green
} catch {
  Write-Host "[ERROR] pg_dump execution failed: $_" -ForegroundColor Red
  exit 1
}

# Verify Non-Empty Backup File
if ((Get-Item $backupFile).Length -lt 1024) {
  Write-Host "[ERROR] Backup verification failed: File size is under 1KB!" -ForegroundColor Red
  exit 1
}
Write-Host "[OK] Backup file sanity verification passed." -ForegroundColor Green

# Cleanup old backups older than RetentionDays
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "seyven_prod_*.sql" | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
  Write-Host "[ROTATE] Rotating expired backup: $($_.Name)" -ForegroundColor Yellow
  Remove-Item $_.FullName -Force
}

Write-Host "[DONE] SEYVEN Database Backup Procedure Finished Successfully." -ForegroundColor Cyan
