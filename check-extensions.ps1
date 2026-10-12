# check-extensions.ps1 — verify that the four required VS Code extensions work
# Extensions: Roo Code, CodeRabbit, GSD (Get Stuff Done), Container / Docker

$ErrorActionPreference = 'Continue'

function Write-Status($tag, $msg) {
    switch ($tag) {
        'OK'      { Write-Host "[OK]      $msg" -ForegroundColor Green  }
        'WARN'    { Write-Host "[WARN]    $msg" -ForegroundColor Yellow }
        'PROBLEM' { Write-Host "[PROBLEM] $msg" -ForegroundColor Red   }
        'INFO'    { Write-Host "[INFO]    $msg" -ForegroundColor Cyan   }
    }
}

Write-Host "`n=== OptiStock Extension Health Check ===" -ForegroundColor Magenta
Write-Host ""

# ─── Gather installed extensions ──────────────────────────────────────────────
try {
    $extensions = & code --list-extensions 2>&1
    if ($LASTEXITCODE -ne 0) { throw "code CLI returned exit code $LASTEXITCODE" }
} catch {
    Write-Status 'PROBLEM' "Cannot run 'code --list-extensions': $_"
    Write-Status 'INFO'    "Make sure the VS Code 'code' CLI is on your PATH."
    exit 1
}

# ─── 1. Roo Code ─────────────────────────────────────────────────────────────
Write-Host "--- Roo Code ---"
$roo = $extensions | Where-Object { $_ -match 'rooveterinaryinc\.roo-cline|saoudrizwan\.claude-dev|roo-cline' }
if ($roo) {
    Write-Status 'OK' "Roo Code extension installed ($roo)"
} else {
    Write-Status 'PROBLEM' "Roo Code extension is NOT installed."
    Write-Status 'INFO'    "Install with: code --install-extension rooveterinaryinc.roo-cline"
}
Write-Host ""

# ─── 2. CodeRabbit ────────────────────────────────────────────────────────────
Write-Host "--- CodeRabbit ---"
$cr = $extensions | Where-Object { $_ -match 'coderabbit\.coderabbit-vscode|coderabbitai\.coderabbit' }
if ($cr) {
    Write-Status 'OK' "CodeRabbit extension installed ($cr)"
} else {
    Write-Status 'PROBLEM' "CodeRabbit extension is NOT installed."
    Write-Status 'INFO'    "Install with: code --install-extension CodeRabbit.coderabbit-vscode"
}

# CodeRabbit needs a git repo
$gitInside = & git rev-parse --is-inside-work-tree 2>&1
if ($gitInside -eq 'true') {
    Write-Status 'OK' "Git repository detected."
    $hasCommits = & git log --oneline -1 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Status 'WARN' "Git repo exists but has no commits. CodeRabbit needs at least one commit."
    } else {
        Write-Status 'OK' "Git repo has commits."
    }
} else {
    Write-Status 'PROBLEM' "No git repository. CodeRabbit requires a git repo."
    Write-Status 'INFO'    "Run: git init && git add -A && git commit -m 'Initial commit'"
}
Write-Host ""

# ─── 3. GSD (Get Stuff Done) ─────────────────────────────────────────────────
Write-Host "--- GSD (Get Stuff Done) ---"
$gsd = $extensions | Where-Object { $_ -match 'fluxlabs\.gsd|gsd' }
if ($gsd) {
    Write-Status 'OK' "GSD extension installed ($gsd)"
} else {
    Write-Status 'PROBLEM' "GSD extension is NOT installed."
    Write-Status 'INFO'    "Install with: code --install-extension FluxLabs.gsd-2"
}

# Check for gsd-pi CLI (Node global)
$gsdPiBin = & where.exe gsd-pi 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Status 'OK' "gsd-pi CLI found on PATH."
} else {
    # Also check npm global list
    try {
        $npmGlobal = & npm list -g --depth=0 2>&1 | Select-String 'gsd-pi'
        if ($npmGlobal) {
            Write-Status 'OK' "gsd-pi is installed globally via npm (but not on PATH)."
        } else {
            Write-Status 'WARN' "gsd-pi CLI not found. Some GSD features may not work."
            Write-Status 'INFO' "Install with: npm install -g gsd-pi"
        }
    } catch {
        Write-Status 'WARN' "gsd-pi CLI not found and npm check failed."
        Write-Status 'INFO' "Install with: npm install -g gsd-pi"
    }
}
Write-Host ""

# ─── 4. Container / Docker ───────────────────────────────────────────────────
Write-Host "--- Container / Docker ---"
$container = $extensions | Where-Object { $_ -match 'ms-azuretools\.vscode-containers|ms-azuretools\.vscode-docker' }
if ($container) {
    Write-Status 'OK' "Container/Docker extension installed ($container)"
} else {
    Write-Status 'PROBLEM' "Container/Docker extension is NOT installed."
    Write-Status 'INFO'    "Install with: code --install-extension ms-azuretools.vscode-docker"
}

# Check Docker CLI
$dockerBin = & where.exe docker 2>&1
if ($LASTEXITCODE -eq 0) {
    $dockerVer = & docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Status 'OK' "Docker CLI available: $dockerVer"
    } else {
        Write-Status 'WARN' "Docker CLI found but 'docker --version' failed."
    }

    # Check Docker daemon
    $dockerInfo = & docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Status 'OK' "Docker daemon is running."
    } else {
        Write-Status 'PROBLEM' "Docker daemon is NOT running."
        Write-Status 'INFO'    "Start Docker Desktop or run: net start com.docker.service"
    }
} else {
    # Check if Docker Desktop is installed but not on PATH
    $ddPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $ddPath) {
        Write-Status 'WARN' "Docker Desktop is installed but docker CLI is not on PATH."
        Write-Status 'INFO' "Start Docker Desktop and ensure 'Add docker to PATH' is enabled in settings."
    } else {
        Write-Status 'PROBLEM' "Docker is NOT installed."
        Write-Status 'INFO'    "Download Docker Desktop from https://www.docker.com/products/docker-desktop/"
    }
}
Write-Host ""

Write-Host "=== Check complete ===" -ForegroundColor Magenta
Write-Host ""
