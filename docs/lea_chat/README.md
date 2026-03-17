# Documentation Chat Léa

Copie des documents expliquant le système de chat IA Léa.

## Fichiers

| Fichier | Description |
|---------|-------------|
| [FICHE_TECHNIQUE_CHAT_LEA.md](./FICHE_TECHNIQUE_CHAT_LEA.md) | **Document principal** — Architecture, Domain-Intent-Entities, flux, checklist |
| [PLAN_REFACTOR_LEA_CHAT.md](./PLAN_REFACTOR_LEA_CHAT.md) | Plan de refactor, scope, architecture cible |
| [REFACTOR_VERIFICATION.md](./REFACTOR_VERIFICATION.md) | Vérification du module lea_chat, structure, chaîne d'intégration |
| [LLM_VS_HEURISTICS.md](./LLM_VS_HEURISTICS.md) | Où le LLM décide vs où les heuristiques servent de fallback |
| [LEA_TRANSACTION_PIPELINE.md](./LEA_TRANSACTION_PIPELINE.md) | Pipeline chat → extraction → BD → affichage |

## Base de connaissance

Les fichiers de connaissance (domaines, intents, champs PA) sont dans :
- `docs/oaciq/LEA_KNOWLEDGE.md`
- `docs/lea/prompts/LEA_ROUTING_KNOWLEDGE.md`
