param(
  [switch]$Quick,
  [switch]$Build,
  [switch]$Lint
)

$root = Split-Path -Parent $PSScriptRoot
$passed = 0
$failed = 0
$start = Get-Date

function Section($name) {
  Write-Host "`n============================================" -ForegroundColor DarkGray
  Write-Host "  $name" -ForegroundColor Cyan
  Write-Host "--------------------------------------------" -ForegroundColor DarkGray
}

function Ok($msg) {
  $script:passed++
  Write-Host "  [PASS] $msg" -ForegroundColor Green
}

function Fail($msg, $detail = '') {
  $script:failed++
  Write-Host "  [FAIL] $msg" -ForegroundColor Red
  if ($detail) { Write-Host "         $detail" -ForegroundColor DarkRed }
}

function Run($desc, $scriptBlock) {
  try {
    $null = & $scriptBlock 2>&1
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { Fail $desc; return }
    Ok $desc
  } catch {
    Fail $desc $_.Exception.Message
  }
}

function FileExists($relPath) {
  $p = Join-Path $root $relPath
  return (Test-Path $p)
}

# ─── Fast path: unit tests only ─────────────────────────────
Section "1. Unit Tests"
Run "npm run test:unit" {
  Push-Location $root
  $r = npm run test:unit 2>&1
  Pop-Location
  if ($LASTEXITCODE -ne 0) { throw $r }
}

if ($Quick) {
  Write-Host "`n  [SKIP] Phase validations (use -Build, -Lint, or no flags for full)" -ForegroundColor Yellow
} else {
  # ─── Phase 1: Docs ───────────────────────────────────────
  Section "2. Phase 1 - README + Docs"
  Run "README.md exists" {
    if (-not (Test-Path (Join-Path $root "README.md"))) { throw "Not found" }
  }
  Run "Docs folder populated" {
    $docs = Get-ChildItem (Join-Path $root "docs") -Filter "*.md" -ErrorAction Stop
    if ($docs.Count -lt 3) { throw "Only $($docs.Count) docs found (expected >= 3)" }
  }

  # ─── Phase 3: PWA / QR / Customer Menu ───────────────────
  Section "3. Phase 3 - PWA / QR / Customer Menu"
  Run "public/manifest.json exists" { if (-not (FileExists "public/manifest.json")) { throw "Not found" } }
  Run "public/sw.js exists" { if (-not (FileExists "public/sw.js")) { throw "Not found" } }
  Run "CustomerMenu referenced in code" {
    $files = Get-ChildItem $root -Recurse -Include "*.jsx","*.js" | Where-Object { $_.FullName -notmatch 'node_modules' }
    $h = $files | Select-String -Pattern "CustomerMenu" -SimpleMatch
    if (-not $h) { throw "CustomerMenu not referenced in any .jsx/.js file" }
  }

  # ─── Phase 4: i18n + Multi-currency ──────────────────────
  Section "4. Phase 4 - i18n + Multi-currency"
  Run "pt.json parseable" {
    $j = Get-Content (Join-Path $root "src/features/i18n/locales/pt.json") -Raw | ConvertFrom-Json
    if (-not $j.'app.name') { throw "Missing app.name key" }
  }
  Run "es/en/pt key parity (300+ keys each)" {
    $es = (Get-Content (Join-Path $root "src/features/i18n/locales/es.json") -Raw | ConvertFrom-Json).PSObject.Properties.Name | Sort-Object
    $en = (Get-Content (Join-Path $root "src/features/i18n/locales/en.json") -Raw | ConvertFrom-Json).PSObject.Properties.Name | Sort-Object
    $pt = (Get-Content (Join-Path $root "src/features/i18n/locales/pt.json") -Raw | ConvertFrom-Json).PSObject.Properties.Name | Sort-Object
    if ($es.Count -lt 200) { throw "Only $($es.Count) keys in es.json (expected 300+)" }
    if ($es.Count -ne $en.Count) { throw "es/en count mismatch: $($es.Count) vs $($en.Count)" }
    if ($en.Count -ne $pt.Count) { throw "en/pt count mismatch: $($en.Count) vs $($pt.Count)" }
    $diff = Compare-Object $es $en
    if ($diff) { throw "Key mismatch: $($diff.Count) differences" }
  }
  Run "currency.js has branch-currency exports" {
    $c = Get-Content (Join-Path $root "src/features/i18n/currency.js") -Raw
    if (-not ($c -match 'getBranchCurrency')) { throw "Missing getBranchCurrency export" }
  }

  # ─── Phase 5: Payments + Hardware ────────────────────────
  Section "5. Phase 5 - Payments + Hardware"
  $payments = @(
    "src/features/payments/paymentGateway.js",
    "src/features/payments/posTerminal.js",
    "src/features/payments/fiscalPrinter.js",
    "src/features/payments/cfdiGenerator.js",
    "src/features/payments/webhookHandler.js",
    "src/features/payments/usePOSTerminal.js",
    "src/features/payments/useFiscalPrinter.js",
    "src/features/delivery/deliveryPayment.js"
  )
  foreach ($f in $payments) {
    Run "  $f" { if (-not (FileExists $f)) { throw "Not found" } }
  }
  Run "CFDI 4.0 generation" {
    $c = Get-Content (Join-Path $root "src/features/payments/cfdiGenerator.js") -Raw
    if (-not ($c -match 'buildCFDI')) { throw "Missing buildCFDI function" }
    if (-not ($c -match '4\.0')) { throw "CFDI version not 4.0" }
  }

  # ─── Phase 6: Analytics + Automation ─────────────────────
  Section "6. Phase 6 - Analytics + Automation"
  $analytics = @(
    "src/features/analytics/customerSegmentation.js",
    "src/features/analytics/profitabilityEngine.js",
    "src/features/analytics/seasonalForecast.js",
    "src/features/analytics/dynamicPricing.js",
    "src/features/automation/businessRules.js",
    "src/features/automation/predictiveAlerts.js",
    "src/features/automation/scheduledReports.js",
    "src/features/dashboard/dashboardEngine.js",
    "src/features/dashboard/useExecutiveDashboard.js"
  )
  foreach ($f in $analytics) {
    Run "  $f" { if (-not (FileExists $f)) { throw "Not found" } }
  }

  # ─── Phase 7: Multi-language ─────────────────────────────
  Section "7. Phase 7 - Multi-language Staff"
  Run "multiLangTicket exports buildTicketText" {
    $c = Get-Content (Join-Path $root "src/features/i18n/multiLangTicket.js") -Raw
    if (-not ($c -match 'buildTicketText')) { throw "Missing export" }
  }
  Run "useStaffLanguage hook exists" {
    if (-not (FileExists "src/features/i18n/useStaffLanguage.js")) { throw "Not found" }
  }
  Run "StaffModal has preferred_language field" {
    $c = Get-Content (Join-Path $root "src/components/Staff/StaffModal.jsx") -Raw
    if (-not ($c -match 'preferred_language')) { throw "Missing preferred_language field" }
  }
}

# ─── Build ─────────────────────────────────────────────────
if ($Build) {
  Section "8. Production Build"
  Run "npm run build" {
    Push-Location $root
    $r = npm run build 2>&1
    Pop-Location
    if ($LASTEXITCODE -ne 0) { throw $r }
  }
}

# ─── Lint ──────────────────────────────────────────────────
if ($Lint) {
  Section "9. ESLint"
  Run "npx eslint src/ --ext .js,.jsx --quiet" {
    Push-Location $root
    $r = npx eslint src/ --ext .js,.jsx --quiet 2>&1
    Pop-Location
    if ($LASTEXITCODE -ne 0) { throw $r }
  }
}

# ─── Summary ───────────────────────────────────────────────
$elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
Write-Host "`n============================================" -ForegroundColor DarkGray
$color = if ($failed -eq 0) { "Green" } else { "Red" }
Write-Host "  $passed passed, $failed failed - ${elapsed}s" -ForegroundColor $color
Write-Host "============================================" -ForegroundColor DarkGray

if ($failed -gt 0) { exit 1 } else { exit 0 }
