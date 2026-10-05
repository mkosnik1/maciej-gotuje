# Maciej gotuje

Prywatna książka kucharska w formie prostej statycznej strony.

## Co tu jest

- lista przepisów z wyszukiwarką, kategoriami i tagami
- strona pojedynczego przepisu
- podsumowanie przepisu: porcje, kalorie i czas
- automatyczna lista tagów z liczbą przepisów i wyszukiwarką tagów
- kalkulator składników według liczby porcji
- kalkulator składników według ilości konkretnego składnika, np. 500 g mąki
- przepisy trzymane jako osobne pliki w `data/recipes/`

## Jak uruchomić lokalnie

Najprościej:

```bash
python3 -m http.server 8000
```

Potem otwórz:

```text
http://localhost:8000
```

Bez serwera przeglądarka może zablokować wczytanie pliku JSON.

## Jak dodać przepis

Dodaj nowy plik w `data/recipes/`, np. `data/recipes/nazwa-przepisu.json`, a potem dopisz jego nazwę do `data/recipes/index.json`.

```json
{
  "slug": "nazwa-przepisu",
  "title": "Nazwa przepisu",
  "category": "Lekkie",
  "tags": ["szybkie", "wegetariańskie"],
  "summary": "Krótki opis.",
  "servings": {
    "base": 2
  },
  "time": {
    "prepMinutes": 10,
    "cookMinutes": 20,
    "totalMinutes": 30
  },
  "nutrition": {
    "caloriesPerServing": 520
  },
  "image": "assets/placeholder.jpg",
  "ingredients": [
    {
      "id": "flour",
      "name": "mąki",
      "amount": 500,
      "unit": "g"
    }
  ],
  "steps": ["Opis kroku."]
}
```

`amount` ustaw na `null`, jeśli składnik jest typu “do smaku”. Taki składnik nie będzie używany jako baza przelicznika, ale nadal pokaże się na liście.
