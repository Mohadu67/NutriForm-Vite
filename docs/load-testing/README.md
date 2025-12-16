# Tests de Charge - Artillery

## Qu'est-ce qu'Artillery ?

**Artillery** est un outil open-source de test de charge et de performance pour les APIs et applications web. Il permet de simuler des centaines/milliers d'utilisateurs simultanés pour vérifier la stabilité et les performances d'un serveur.

**Site officiel :** https://www.artillery.io/

## Installation

Artillery s'installe via npm :

```bash
# Installation globale
npm install -g artillery

# Ou utilisation via npx (sans installation)
npx artillery --version
```

## Fichiers de configuration

### `load-test.yml` - Test de charge normale

Simule une utilisation normale avec montée progressive :
- **Warm up** : 20s @ 10 users/s
- **Normal** : 60s @ 25 users/s
- **Peak** : 40s @ 40 users/s

### `load-test-intense.yml` - Stress test

Simule une charge extrême pour trouver les limites :
- **Warm up** : 15s @ 30 users/s
- **Ramp up** : 30s de 50 à 100 users/s
- **High load** : 45s @ 100 users/s
- **Stress** : 30s @ 150 users/s

## Commandes

### Lancer un test

```bash
# Test normal
npx artillery run docs/load-testing/load-test.yml

# Test intense (stress test)
npx artillery run docs/load-testing/load-test-intense.yml
```

### Générer un rapport HTML

```bash
# Lancer le test et sauvegarder les résultats
npx artillery run --output results.json docs/load-testing/load-test.yml

# Générer le rapport HTML
npx artillery report results.json
```

### Quick test (sans fichier config)

```bash
# Test rapide sur un endpoint
npx artillery quick --count 100 --num 10 https://api.harmonith.fr/api/health
```

Options :
- `--count` : Nombre total de requêtes
- `--num` : Nombre d'utilisateurs virtuels simultanés

## Structure d'un fichier de config

```yaml
config:
  target: "https://api.harmonith.fr"  # URL cible
  phases:
    - duration: 60          # Durée en secondes
      arrivalRate: 10       # Nouveaux users/seconde
      name: "Phase name"    # Nom de la phase
    - duration: 30
      arrivalRate: 10
      rampTo: 50            # Montée progressive jusqu'à 50 users/s

scenarios:
  - name: "Nom du scénario"
    weight: 5               # Probabilité (plus élevé = plus fréquent)
    flow:
      - get:
          url: "/api/endpoint"
      - post:
          url: "/api/autre"
          json:
            key: "value"
```

## Comprendre les résultats

### Codes HTTP
- **200** : Succès
- **429** : Rate limited (trop de requêtes)
- **5xx** : Erreur serveur (problème!)

### Métriques de temps
- **min** : Temps de réponse minimum
- **max** : Temps de réponse maximum
- **mean** : Moyenne
- **median** : Médiane (50% des requêtes)
- **p95** : 95% des requêtes sont plus rapides
- **p99** : 99% des requêtes sont plus rapides

### Exemple de bons résultats
```
http.codes.200: 1000        # 100% succès
http.codes.429: 0           # Pas de rate limiting
http.response_time:
  mean: 20ms                # Moyenne rapide
  p95: 30ms                 # Très bon
  p99: 50ms                 # Acceptable
```

## Bonnes pratiques

1. **Prévenir avant de tester** - Les tests de charge peuvent déclencher le rate limiting
2. **Commencer petit** - Toujours commencer par un test léger
3. **Monitorer le serveur** - Surveiller CPU/RAM pendant le test
4. **Tester en heures creuses** - Éviter d'impacter les vrais utilisateurs
5. **Whitelist ton IP** - Ajouter `RATE_LIMIT_WHITELIST=ton.ip` dans `.env`

## Attention

Les tests de charge envoient beaucoup de requêtes rapidement. Cela peut :
- Déclencher le rate limiting (erreur 429)
- Bloquer ton IP temporairement
- Impacter les performances pour les vrais utilisateurs

**Solution si bloqué :**
```bash
# Attendre 15 minutes (durée du rate limit)
# Ou redémarrer le serveur pour reset le compteur
pm2 restart all
```

---

*Documentation créée le 16/12/2025*
