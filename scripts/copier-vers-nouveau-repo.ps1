# Script PowerShell pour copier le projet vers un nouveau dépôt Git
# Usage: .\scripts\copier-vers-nouveau-repo.ps1

param(
    [string]$NouveauRepoUrl = "",
    [switch]$GarderAncienRemote = $false,
    [switch]$Force = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migration vers nouveau dépôt Git" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans un dépôt Git
if (-not (Test-Path .git)) {
    Write-Host "❌ Erreur : Ce répertoire n'est pas un dépôt Git !" -ForegroundColor Red
    Write-Host "   Assurez-vous d'exécuter ce script depuis la racine du projet." -ForegroundColor Yellow
    exit 1
}

# Vérifier l'état Git
Write-Host "📋 Vérification de l'état Git..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status -and -not $Force) {
    Write-Host "⚠️  Attention : Vous avez des modifications non commitées !" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Modifications détectées :" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $reponse = Read-Host "Voulez-vous les commiter maintenant ? (o/n)"
    if ($reponse -eq "o" -or $reponse -eq "O") {
        $message = Read-Host "Message de commit (ou laissez vide pour message par défaut)"
        if ([string]::IsNullOrWhiteSpace($message)) {
            $message = "chore: sauvegarde avant migration vers nouveau repo"
        }
        git add .
        git commit -m $message
        Write-Host "✅ Modifications commitées" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration annulée. Commitez vos modifications d'abord." -ForegroundColor Red
        exit 1
    }
}

# Afficher les remotes actuels
Write-Host ""
Write-Host "📡 Remotes actuels :" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Demander l'URL du nouveau dépôt si non fournie
if ([string]::IsNullOrWhiteSpace($NouveauRepoUrl)) {
    Write-Host "🔗 Entrez l'URL du nouveau dépôt Git :" -ForegroundColor Cyan
    Write-Host "   Exemple: https://github.com/votre-username/nouveau-repo.git" -ForegroundColor Gray
    $NouveauRepoUrl = Read-Host "URL"
}

# Valider l'URL
if ([string]::IsNullOrWhiteSpace($NouveauRepoUrl)) {
    Write-Host "❌ Erreur : URL du dépôt requise !" -ForegroundColor Red
    exit 1
}

# Afficher les branches et tags
Write-Host ""
Write-Host "📊 Branches locales :" -ForegroundColor Yellow
git branch
Write-Host ""
Write-Host "🏷️  Tags :" -ForegroundColor Yellow
$tags = git tag
if ($tags) {
    git tag | Select-Object -First 10
    if ((git tag | Measure-Object).Count -gt 10) {
        Write-Host "   ... et $((git tag | Measure-Object).Count - 10) autres tags" -ForegroundColor Gray
    }
} else {
    Write-Host "   Aucun tag" -ForegroundColor Gray
}

# Confirmation
Write-Host ""
Write-Host "⚠️  Vous êtes sur le point de :" -ForegroundColor Yellow
Write-Host "   1. Ajouter le nouveau dépôt comme remote" -ForegroundColor White
Write-Host "   2. Pousser toutes les branches vers: $NouveauRepoUrl" -ForegroundColor White
Write-Host "   3. Pousser tous les tags vers: $NouveauRepoUrl" -ForegroundColor White
if ($GarderAncienRemote) {
    Write-Host "   4. Garder l'ancien remote comme backup" -ForegroundColor White
} else {
    Write-Host "   4. Remplacer l'ancien remote 'origin'" -ForegroundColor White
}
Write-Host ""

$confirmation = Read-Host "Continuer ? (o/n)"
if ($confirmation -ne "o" -and $confirmation -ne "O") {
    Write-Host "❌ Migration annulée" -ForegroundColor Red
    exit 0
}

# Ajouter le nouveau remote
Write-Host ""
Write-Host "🔗 Ajout du nouveau remote..." -ForegroundColor Yellow

if ($GarderAncienRemote) {
    # Garder l'ancien remote et ajouter le nouveau
    $ancienOrigin = git remote get-url origin
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Pas de remote 'origin' trouvé, création d'un nouveau..." -ForegroundColor Yellow
    } else {
        Write-Host "   Ancien origin sauvegardé comme 'ancien-origin'" -ForegroundColor Gray
        git remote rename origin ancien-origin 2>$null
    }
    git remote add origin $NouveauRepoUrl
} else {
    # Remplacer l'ancien remote
    git remote set-url origin $NouveauRepoUrl
}

Write-Host "✅ Remote configuré" -ForegroundColor Green

# Vérifier la connexion
Write-Host ""
Write-Host "🔍 Vérification de la connexion au nouveau dépôt..." -ForegroundColor Yellow
try {
    git ls-remote origin 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connexion réussie" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Impossible de se connecter au dépôt. Vérifiez l'URL et vos permissions." -ForegroundColor Yellow
        Write-Host "   Continuons quand même..." -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Erreur lors de la vérification : $_" -ForegroundColor Yellow
    Write-Host "   Continuons quand même..." -ForegroundColor Gray
}

# Pousser toutes les branches
Write-Host ""
Write-Host "📤 Poussage de toutes les branches..." -ForegroundColor Yellow
$branches = git branch --format='%(refname:short)'
$branchesCount = ($branches | Measure-Object).Count
Write-Host "   $branchesCount branche(s) à pousser" -ForegroundColor Gray

try {
    git push -u origin --all
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Toutes les branches poussées avec succès" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors du push des branches" -ForegroundColor Red
        Write-Host "   Code d'erreur: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors du push : $_" -ForegroundColor Red
    exit 1
}

# Pousser tous les tags
Write-Host ""
Write-Host "🏷️  Poussage de tous les tags..." -ForegroundColor Yellow
$tagsCount = (git tag | Measure-Object).Count
if ($tagsCount -gt 0) {
    Write-Host "   $tagsCount tag(s) à pousser" -ForegroundColor Gray
    try {
        git push -u origin --tags
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Tous les tags poussés avec succès" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Erreur lors du push des tags (peut être ignoré)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Erreur lors du push des tags : $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Aucun tag à pousser" -ForegroundColor Gray
}

# Résumé final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Migration terminée avec succès !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Résumé :" -ForegroundColor Yellow
Write-Host "   • Remote 'origin' : $NouveauRepoUrl" -ForegroundColor White
if ($GarderAncienRemote) {
    Write-Host "   • Ancien remote sauvegardé comme 'ancien-origin'" -ForegroundColor White
}
Write-Host "   • Branches poussées : $branchesCount" -ForegroundColor White
Write-Host "   • Tags poussés : $tagsCount" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Vérification finale :" -ForegroundColor Yellow
Write-Host ""
git remote -v
Write-Host ""
Write-Host "💡 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "   1. Vérifiez le nouveau dépôt sur GitHub/GitLab" -ForegroundColor White
Write-Host "   2. Mettez à jour les références dans README.md et autres docs" -ForegroundColor White
Write-Host "   3. Mettez à jour les workflows CI/CD si nécessaire" -ForegroundColor White
Write-Host "   4. Testez avec: git pull && git push" -ForegroundColor White
Write-Host ""
Write-Host "🎉 C'est fait ! Votre projet a été migré vers le nouveau dépôt." -ForegroundColor Green
