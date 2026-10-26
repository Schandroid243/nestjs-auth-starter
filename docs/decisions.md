# ADR : Stockage et transport du RefreshToken

## Choix

Nous avons choisi de stocker le Refresh Token côté client dans un **cookie HTTP-only, sécurisé (`secure`), avec l'attribut `SameSite=Strict`** (ou `Lax` selon les besoins d'intégration cross-site front/back).

## Justification

1. **Protection contre les attaques XSS** : En marquant le cookie comme `HttpOnly`, le code JavaScript exécuté dans le navigateur (y compris les scripts tiers ou malveillants) ne peut pas lire le Refresh Token via `document.cookie` ou `localStorage`, éliminant le risque de vol de session à grande échelle.
2. **Atténuation des risques CSRF** : L'utilisation de l'attribut `SameSite=Strict` empêche le navigateur d'envoyer le cookie lors de requêtes initiées par des sites tiers, protégeant ainsi l'application contre les failles de type Cross-Site Request Forgery.
3. **Séparation des rôles** :
   - L'**Access Token** (courte durée : 15 min) transite de manière éphémère en mémoire vive (RAM) de l'application cliente.
   - Le **Refresh Token** (longue durée : 7 jours) est géré de manière opaque et sécurisée directement par le stockage du navigateur via le protocole HTTP.
