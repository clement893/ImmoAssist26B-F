#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de vérification de la configuration Google OAuth
Aide à diagnostiquer les problèmes de redirect_uri_mismatch
"""

import os
import sys
from urllib.parse import urlparse

# Configurer l'encodage UTF-8 pour Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def check_google_oauth_config():
    """Vérifie la configuration Google OAuth et affiche l'URI de redirection utilisé"""
    
    print("=" * 70)
    print("Vérification de la configuration Google OAuth")
    print("=" * 70)
    print()
    
    # Vérifier les variables d'environnement
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "")
    base_url = os.getenv("BASE_URL", "")
    api_v1_str = os.getenv("API_V1_STR", "/api/v1")
    
    print("Variables d'environnement:")
    print(f"   GOOGLE_CLIENT_ID: {'[OK] Defini' if google_client_id else '[ERREUR] Non defini'}")
    if google_client_id:
        print(f"      Valeur: {google_client_id[:30]}...")
    
    print(f"   GOOGLE_CLIENT_SECRET: {'[OK] Defini' if google_client_secret else '[ERREUR] Non defini'}")
    
    print(f"   GOOGLE_REDIRECT_URI: {'[OK] Defini' if google_redirect_uri else '[INFO] Non defini'}")
    if google_redirect_uri:
        print(f"      Valeur: {google_redirect_uri}")
    
    print(f"   BASE_URL: {'[OK] Defini' if base_url else '[INFO] Non defini'}")
    if base_url:
        print(f"      Valeur: {base_url}")
    
    print(f"   API_V1_STR: {api_v1_str}")
    print()
    
    # Déterminer l'URI de redirection utilisé
    if google_redirect_uri:
        redirect_uri = google_redirect_uri.rstrip("/")
        source = "GOOGLE_REDIRECT_URI"
    elif base_url:
        backend_base_url = base_url.rstrip("/")
        redirect_uri = f"{backend_base_url}{api_v1_str}/auth/google/callback"
        source = "BASE_URL (construit automatiquement)"
    else:
        redirect_uri = "http://localhost:8000/api/v1/auth/google/callback"
        source = "Valeur par defaut"
    
    print("=" * 70)
    print("URI de redirection utilise par le backend:")
    print("=" * 70)
    print(f"   {redirect_uri}")
    print(f"   Source: {source}")
    print()
    
    # Valider l'URI
    try:
        parsed = urlparse(redirect_uri)
        if not parsed.scheme or not parsed.netloc:
            print("[ERREUR] URI de redirection invalide!")
            print(f"   L'URI doit avoir un schema (http/https) et un domaine")
            return False
        print("[OK] URI de redirection valide")
    except Exception as e:
        print(f"[ERREUR] Erreur lors de la validation de l'URI: {e}")
        return False
    
    print()
    print("=" * 70)
    print("Instructions pour Google Cloud Console:")
    print("=" * 70)
    print()
    print("1. Allez sur https://console.cloud.google.com/")
    print("2. Sélectionnez votre projet")
    print("3. Allez dans 'APIs & Services' > 'Credentials'")
    print("4. Cliquez sur votre 'OAuth 2.0 Client ID'")
    print("5. Dans 'Authorized redirect URIs', ajoutez EXACTEMENT:")
    print()
    print(f"   {redirect_uri}")
    print()
    print("[IMPORTANT]")
    print("   - L'URI doit correspondre EXACTEMENT (caractere par caractere)")
    print("   - Pas de trailing slash a la fin")
    print("   - Meme protocole (http/https)")
    print("   - Meme port si specifie")
    print("   - Meme chemin complet")
    print()
    
    # Vérifications supplémentaires
    print("=" * 70)
    print("Verifications supplementaires:")
    print("=" * 70)
    
    issues = []
    
    # Vérifier trailing slash
    if redirect_uri.endswith("/"):
        issues.append("[ERREUR] L'URI se termine par un '/' - supprimez-le")
    else:
        print("[OK] Pas de trailing slash")
    
    # Vérifier le protocole
    if parsed.scheme == "http" and "localhost" not in parsed.netloc:
        issues.append("[ATTENTION] Utilisation de HTTP (non securise) - utilisez HTTPS en production")
    elif parsed.scheme == "https":
        print("[OK] Utilisation de HTTPS")
    else:
        print("[OK] Protocole approprie pour le developpement")
    
    # Vérifier le format du chemin
    expected_path = f"{api_v1_str}/auth/google/callback"
    if not redirect_uri.endswith(expected_path):
        issues.append(f"[ERREUR] Le chemin devrait se terminer par '{expected_path}'")
    else:
        print(f"[OK] Chemin correct: {expected_path}")
    
    # Vérifier que GOOGLE_CLIENT_ID est configuré
    if not google_client_id:
        issues.append("[ERREUR] GOOGLE_CLIENT_ID n'est pas defini")
    else:
        print("[OK] GOOGLE_CLIENT_ID est defini")
    
    # Vérifier que GOOGLE_CLIENT_SECRET est configuré
    if not google_client_secret:
        issues.append("[ERREUR] GOOGLE_CLIENT_SECRET n'est pas defini")
    else:
        print("[OK] GOOGLE_CLIENT_SECRET est defini")
    
    print()
    
    if issues:
        print("=" * 70)
        print("Problemes detectes:")
        print("=" * 70)
        for issue in issues:
            print(f"   {issue}")
        print()
        return False
    
    print("=" * 70)
    print("[OK] Configuration semble correcte!")
    print("=" * 70)
    print()
    print("Si vous rencontrez toujours l'erreur 'redirect_uri_mismatch':")
    print("1. Vérifiez que l'URI dans Google Cloud Console correspond EXACTEMENT")
    print("2. Vérifiez les logs du backend lors de l'appel à /api/v1/auth/google")
    print("3. Assurez-vous d'utiliser le bon OAuth Client ID (dev vs prod)")
    print()
    
    return True

if __name__ == "__main__":
    try:
        success = check_google_oauth_config()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nInterrompu par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERREUR] Erreur: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
