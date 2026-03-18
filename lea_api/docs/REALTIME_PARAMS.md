# Paramètres OpenAI Realtime — bruit et VAD

## Paramètres utilisés dans la session Realtime

### 1. Réduction du bruit (`input_audio_noise_reduction`)

Appliqué **avant** la VAD et la transcription. Réduit les faux déclenchements dus au bruit ambiant.

| Valeur | Usage |
|--------|--------|
| `{"type": "near_field"}` | Micro proche (casque, écouteurs) — **défaut** |
| `{"type": "far_field"}` | Micro distant (laptop, salle de conférence) |
| `null` | Désactivé |

### 2. VAD — seuil (`turn_detection.threshold`)

- **0 à 1** — plus haut = il faut un audio **plus fort** pour être détecté comme parole
- Défaut API : 0.5
- **0.6–0.7** : utile en environnement bruyant, limite les hallucinations sur du silence
- Trop haut (> 0.8) : risque de ne pas détecter une parole plus faible

### 3. Silence (`turn_detection.silence_duration_ms`)

- Durée de silence (ms) avant de considérer que le locuteur a fini
- **Plus long** : moins de fausses fins de tour sur des pauses courtes
- Actuel : 1200 ms

### 4. Transcription (`input_audio_transcription`)

- `prompt` (optionnel) : pour `gpt-4o-transcribe`, texte libre qui guide la transcription (ex. "expect words related to real estate, Quebec French")
- `whisper-1` : liste de mots-clés uniquement

---

## Référence

- [OpenAI Realtime VAD](https://platform.openai.com/docs/api-reference/guides/realtime-vad/)
- [OpenAI Realtime transcription (noise_reduction)](https://platform.openai.com/docs/guides/realtime-transcription)
