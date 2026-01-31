# Script PowerShell pour remplacer les couleurs hardcodées par les tokens du thème
# Usage: .\fix-hardcoded-colors.ps1 -FilePath "path/to/file.tsx"

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

$replacements = @{
    # Backgrounds
    'bg-white' = 'bg-background'
    'bg-black' = 'bg-foreground'
    'bg-gray-50' = 'bg-muted'
    'bg-gray-100' = 'bg-muted'
    'bg-gray-200' = 'bg-muted'
    'bg-gray-300' = 'bg-muted'
    'bg-gray-700' = 'bg-muted'
    'bg-gray-800' = 'bg-muted'
    'bg-gray-900' = 'bg-muted'
    'bg-gray-950' = 'bg-muted'
    
    # Text colors
    'text-black' = 'text-foreground'
    'text-white' = 'text-background'
    'text-gray-400' = 'text-muted-foreground'
    'text-gray-500' = 'text-muted-foreground'
    'text-gray-600' = 'text-muted-foreground'
    'text-gray-700' = 'text-foreground'
    'text-gray-800' = 'text-foreground'
    
    # Borders
    'border-gray-200' = 'border-border'
    'border-gray-300' = 'border-border'
    'border-gray-600' = 'border-border'
    'border-gray-700' = 'border-border'
    'border-black' = 'border-foreground'
    
    # Semantic colors - Red/Error
    'bg-red-50' = 'bg-error-50'
    'bg-red-100' = 'bg-error-100'
    'bg-red-200' = 'bg-error-200'
    'bg-red-500' = 'bg-error-500'
    'bg-red-600' = 'bg-error-600'
    'text-red-600' = 'text-error-600'
    'text-red-800' = 'text-error-800'
    'border-red-200' = 'border-error-200'
    'border-red-500' = 'border-error-500'
    
    # Semantic colors - Green/Success
    'bg-green-50' = 'bg-success-50'
    'bg-green-100' = 'bg-success-100'
    'bg-green-500' = 'bg-success-500'
    'bg-green-600' = 'bg-success-600'
    'text-green-600' = 'text-success-600'
    'text-green-800' = 'text-success-800'
    
    # Semantic colors - Yellow/Warning
    'bg-yellow-50' = 'bg-warning-50'
    'bg-yellow-100' = 'bg-warning-100'
    'bg-yellow-500' = 'bg-warning-500'
    'text-yellow-600' = 'text-warning-600'
    'text-yellow-800' = 'text-warning-800'
    'border-yellow-300' = 'border-warning-300'
    
    # Semantic colors - Blue/Info
    'bg-blue-50' = 'bg-info-50'
    'bg-blue-100' = 'bg-info-100'
    'bg-blue-500' = 'bg-info-500'
    'bg-blue-600' = 'bg-info-600'
    'text-blue-600' = 'text-info-600'
    'border-blue-200' = 'border-info-200'
    'border-blue-500' = 'border-info-500'
    'border-blue-800' = 'border-info-800'
    
    # Hover states
    'hover:bg-gray-50' = 'hover:bg-muted'
    'hover:bg-gray-100' = 'hover:bg-muted'
    'hover:bg-gray-900' = 'hover:bg-muted'
    'hover:bg-black' = 'hover:bg-foreground'
    'hover:border-black' = 'hover:border-foreground'
    'hover:text-black' = 'hover:text-foreground'
    
    # Focus states
    'focus:border-black' = 'focus:border-foreground'
    
    # Dark mode variants (keep as fallback but prefer theme tokens)
    'dark:bg-gray-700' = 'dark:bg-muted'
    'dark:bg-gray-800' = 'dark:bg-muted'
    'dark:text-gray-200' = 'dark:text-foreground'
    'dark:border-gray-600' = 'dark:border-border'
    'dark:border-gray-700' = 'dark:border-border'
}

if (-not (Test-Path $FilePath)) {
    Write-Host "❌ File not found: $FilePath" -ForegroundColor Red
    exit 1
}

$content = Get-Content $FilePath -Raw
$originalContent = $content
$modified = $false

foreach ($pattern in $replacements.Keys) {
    if ($content -match [regex]::Escape($pattern)) {
        $content = $content -replace [regex]::Escape($pattern), $replacements[$pattern]
        $modified = $true
        Write-Host "  ✓ Replaced: $pattern → $($replacements[$pattern])" -ForegroundColor Green
    }
}

if ($modified) {
    Set-Content -Path $FilePath -Value $content -NoNewline
    Write-Host "✅ File updated: $FilePath" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No replacements made in: $FilePath" -ForegroundColor Yellow
}
