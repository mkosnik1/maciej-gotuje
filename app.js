const app = document.querySelector("#app");
const cardTemplate = document.querySelector("#recipe-card-template");

let recipes = [];
let selectedTag = "all";
let searchTerm = "";
let tagSearchTerm = "";
let selectedCategory = "all";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

const pluralServings = (count) => {
  if (count === 1) return "porcja";
  if ([2, 3, 4].includes(count)) return "porcje";
  return "porcji";
};

const byTitle = (a, b) => a.title.localeCompare(b.title, "pl");

async function loadRecipes() {
  try {
    const response = await fetch("data/recipes.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    recipes = await response.json();
    render();
  } catch (error) {
    app.innerHTML = `
      <section class="empty-state">
        <h2>Nie udało się wczytać przepisów.</h2>
        <p>Jeśli otwierasz plik bezpośrednio z dysku, uruchom lokalny serwer HTTP.</p>
      </section>
    `;
  }
}

function render() {
  const route = window.location.hash || "#/";
  if (route.startsWith("#/recipe/")) {
    renderRecipe(route.replace("#/recipe/", ""));
    return;
  }
  if (route === "#/schema") {
    renderSchema();
    return;
  }
  renderHome();
}

function getAllTags() {
  return [...new Set(recipes.flatMap((recipe) => recipe.tags))].sort((a, b) => a.localeCompare(b, "pl"));
}

function getTagCounts() {
  return recipes.reduce((counts, recipe) => {
    recipe.tags.forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
    return counts;
  }, {});
}

function getVisibleTags() {
  const normalizedSearch = tagSearchTerm.trim().toLowerCase();
  return getAllTags().filter((tag) => {
    if (!normalizedSearch) return true;
    return tag.toLowerCase().includes(normalizedSearch);
  });
}

function getAllCategories() {
  return [...new Set(recipes.map((recipe) => recipe.category))].sort((a, b) => a.localeCompare(b, "pl"));
}

function getFilteredRecipes() {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  return recipes
    .filter((recipe) => selectedTag === "all" || recipe.tags.includes(selectedTag))
    .filter((recipe) => selectedCategory === "all" || recipe.category === selectedCategory)
    .filter((recipe) => {
      if (!normalizedSearch) return true;
      return [recipe.title, recipe.summary, recipe.category, ...recipe.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort(byTitle);
}

function renderHome() {
  const filteredRecipes = getFilteredRecipes();
  const tagCounts = getTagCounts();
  const visibleTags = getVisibleTags();
  const allTags = getAllTags();
  const allCategories = getAllCategories();
  app.innerHTML = `
    <section class="page-heading">
      <div>
        <p class="eyebrow">Książka kucharska</p>
        <h1>Przepisy</h1>
      </div>
      <div class="quick-stats" aria-label="Podsumowanie książki kucharskiej">
        <span><strong>${recipes.length}</strong> przepisy</span>
        <span><strong>${allCategories.length}</strong> kategorie</span>
        <span><strong>${allTags.length}</strong> tagi</span>
      </div>
    </section>
    <div class="layout">
      <aside class="filters">
        <h2>Filtry</h2>
        <div class="field">
          <label for="search">Szukaj</label>
          <input id="search" type="search" value="${escapeHtml(searchTerm)}" placeholder="np. makaron, szybkie, tofu">
        </div>
        <div class="field">
          <label for="category">Kategoria</label>
          <select id="category">
            <option value="all">Wszystkie</option>
            ${allCategories
              .map((category) => `<option value="${escapeHtml(category)}" ${category === selectedCategory ? "selected" : ""}>${escapeHtml(category)}</option>`)
              .join("")}
          </select>
        </div>
        <h2>Tagi</h2>
        <div class="field">
          <label for="tag-search">Szukaj tagu</label>
          <input id="tag-search" type="search" value="${escapeHtml(tagSearchTerm)}" placeholder="np. szybkie, słodkie">
        </div>
        <div class="tag-filter">
          <button class="tag-button ${selectedTag === "all" ? "is-active" : ""}" data-tag="all">Wszystkie <span>${recipes.length}</span></button>
          ${visibleTags
            .map((tag) => `<button class="tag-button ${tag === selectedTag ? "is-active" : ""}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)} <span>${tagCounts[tag]}</span></button>`)
            .join("")}
        </div>
      </aside>
      <section>
        <h2 class="section-title">${filteredRecipes.length} przepisy</h2>
        <div class="recipe-grid" id="recipe-grid"></div>
      </section>
    </div>
  `;

  app.querySelector("#search").addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderHome();
  });

  app.querySelector("#category").addEventListener("change", (event) => {
    selectedCategory = event.target.value;
    renderHome();
  });

  app.querySelector("#tag-search").addEventListener("input", (event) => {
    tagSearchTerm = event.target.value;
    renderHome();
  });

  app.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTag = button.dataset.tag;
      renderHome();
    });
  });

  const grid = app.querySelector("#recipe-grid");
  if (!filteredRecipes.length) {
    grid.innerHTML = `<div class="empty-state">Brak przepisów dla tych filtrów.</div>`;
    return;
  }

  filteredRecipes.forEach((recipe) => {
    const card = cardTemplate.content.cloneNode(true);
    const link = document.createElement("a");
    link.href = `#/recipe/${recipe.slug}`;
    link.setAttribute("aria-label", `Otwórz przepis: ${recipe.title}`);

    const article = card.querySelector(".recipe-card");
    card.querySelector(".recipe-card__meta").textContent = `${recipe.category} • ${recipe.time.totalMinutes} min`;
    card.querySelector("h2").textContent = recipe.title;
    card.querySelector("p").textContent = recipe.summary;
    card.querySelector(".tag-list").innerHTML = recipe.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");

    link.append(article);
    grid.append(link);
  });
}

function renderRecipe(slug) {
  const recipe = recipes.find((item) => item.slug === slug);
  if (!recipe) {
    app.innerHTML = `<section class="empty-state">Nie ma takiego przepisu.</section>`;
    return;
  }

  app.innerHTML = `
    <article class="recipe-page">
      <a class="back-link" href="#/">← Wszystkie przepisy</a>
      <section class="recipe-hero">
        <div class="recipe-hero__body">
          <p class="eyebrow">${escapeHtml(recipe.category)}</p>
          <h1>${escapeHtml(recipe.title)}</h1>
          <p>${escapeHtml(recipe.summary)}</p>
          <div class="stats">
            <span class="stat">${recipe.servings.base} ${pluralServings(recipe.servings.base)}</span>
            <span class="stat">${recipe.nutrition.caloriesPerServing} kcal / porcję</span>
            <span class="stat">${recipe.time.totalMinutes} min łącznie</span>
          </div>
        </div>
        <div class="recipe-hero__image" aria-label="Placeholder zdjęcia przepisu"></div>
      </section>

      <section class="content-grid">
        <div class="panel">
          <h2>Składniki</h2>
          <div id="calculator" class="calculator"></div>
          <ol class="ingredient-list" id="ingredients"></ol>
        </div>
        <div class="panel">
          <h2>Przygotowanie</h2>
          <ol class="steps">
            ${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
          </ol>
        </div>
      </section>
    </article>
  `;

  setupCalculator(recipe);
}

function setupCalculator(recipe) {
  const calculator = app.querySelector("#calculator");
  const ingredientsList = app.querySelector("#ingredients");
  let mode = "servings";
  let targetServings = recipe.servings.base;
  let selectedIngredientId = recipe.ingredients.find((ingredient) => ingredient.amount)?.id || recipe.ingredients[0].id;
  let targetAmount = recipe.ingredients.find((ingredient) => ingredient.id === selectedIngredientId)?.amount || 0;

  const getFactor = () => {
    if (mode === "servings") return targetServings / recipe.servings.base;
    const selectedIngredient = recipe.ingredients.find((ingredient) => ingredient.id === selectedIngredientId);
    if (!selectedIngredient?.amount) return 1;
    return targetAmount / selectedIngredient.amount;
  };

  const renderIngredients = () => {
    const factor = getFactor();
    ingredientsList.innerHTML = recipe.ingredients
      .map((ingredient) => {
        const amount = ingredient.amount ? `${formatNumber(ingredient.amount * factor)} ${ingredient.unit}` : ingredient.unit;
        return `<li><strong>${escapeHtml(amount)}</strong> ${escapeHtml(ingredient.name)}</li>`;
      })
      .join("");
  };

  const renderCalculator = () => {
    const measurableIngredients = recipe.ingredients.filter((ingredient) => ingredient.amount);
    calculator.innerHTML = `
      <div class="calculator__mode">
        <button type="button" class="${mode === "servings" ? "is-active" : ""}" data-mode="servings">Według porcji</button>
        <button type="button" class="${mode === "ingredient" ? "is-active" : ""}" data-mode="ingredient">Według składnika</button>
      </div>
      ${
        mode === "servings"
          ? `
            <div class="field">
              <label for="target-servings">Ile porcji chcesz zrobić?</label>
              <input id="target-servings" type="number" min="0.25" step="0.25" value="${targetServings}">
            </div>
          `
          : `
            <div class="field">
              <label for="ingredient-choice">Jaki składnik ogranicza przepis?</label>
              <select id="ingredient-choice">
                ${measurableIngredients
                  .map((ingredient) => `<option value="${escapeHtml(ingredient.id)}" ${ingredient.id === selectedIngredientId ? "selected" : ""}>${escapeHtml(ingredient.name)} (${escapeHtml(ingredient.unit)})</option>`)
                  .join("")}
              </select>
            </div>
            <div class="field">
              <label for="target-amount">Ile masz?</label>
              <input id="target-amount" type="number" min="0" step="1" value="${targetAmount}">
            </div>
          `
      }
    `;

    calculator.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        mode = button.dataset.mode;
        renderCalculator();
        renderIngredients();
      });
    });

    const servingsInput = calculator.querySelector("#target-servings");
    if (servingsInput) {
      servingsInput.addEventListener("input", (event) => {
        targetServings = Number(event.target.value) || recipe.servings.base;
        renderIngredients();
      });
    }

    const ingredientChoice = calculator.querySelector("#ingredient-choice");
    if (ingredientChoice) {
      ingredientChoice.addEventListener("change", (event) => {
        selectedIngredientId = event.target.value;
        const ingredient = recipe.ingredients.find((item) => item.id === selectedIngredientId);
        targetAmount = ingredient?.amount || 0;
        renderCalculator();
        renderIngredients();
      });
    }

    const amountInput = calculator.querySelector("#target-amount");
    if (amountInput) {
      amountInput.addEventListener("input", (event) => {
        targetAmount = Number(event.target.value) || 0;
        renderIngredients();
      });
    }
  };

  renderCalculator();
  renderIngredients();
}

function renderSchema() {
  const example = {
    slug: "nazwa-przepisu",
    title: "Nazwa przepisu",
    category: "Lekkie / Sycące / Wypieki / Desery / Bazy",
    tags: ["szybkie", "wegańskie", "tanie"],
    summary: "Krótki opis przepisu.",
    servings: { base: 2 },
    time: { prepMinutes: 10, cookMinutes: 20, totalMinutes: 30 },
    nutrition: { caloriesPerServing: 520 },
    image: "assets/placeholder.jpg",
    ingredients: [
      { id: "flour", name: "mąki", amount: 500, unit: "g" },
      { id: "salt", name: "soli", amount: 1, unit: "łyżeczka" },
      { id: "pepper", name: "pieprzu", amount: null, unit: "do smaku" }
    ],
    steps: ["Pierwszy krok.", "Drugi krok."]
  };

  app.innerHTML = `
    <section class="schema">
      <a class="back-link" href="#/">← Wszystkie przepisy</a>
      <h1>Format przepisu w JSON</h1>
      <p>Nowe przepisy dopisuj jako kolejne obiekty w <code>data/recipes.json</code>.</p>
      <pre><code>${JSON.stringify(example, null, 2)}</code></pre>
    </section>
  `;
}

window.addEventListener("hashchange", render);
loadRecipes();
