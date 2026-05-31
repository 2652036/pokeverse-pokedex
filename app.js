// ==========================================================================
// Pokémon Pokedex (PokéVerse) Core JavaScript
// ==========================================================================

// Global App State
let pokemonList = [];      // Raw loaded list from pokemon_names.json
let filteredList = [];     // List after applying search, type, and gen filters
let loadedCount = 24;      // Number of currently rendered cards (pagination)
const itemsPerPage = 24;   // Load count step size
const detailsCache = new Map(); // Cache for detailed Pokemon data (modal)
let activePokemonId = null; // Currently selected pokemon in modal
let currentAudio = null;    // Active Audio instance playing cry

// PokeAPI Type Translation and Icons mapping
const TYPE_DETAILS = {
  normal: { ko: "노말", icon: "ph ph-circle" },
  fire: { ko: "불꽃", icon: "ph ph-flame" },
  water: { ko: "물", icon: "ph ph-drop" },
  electric: { ko: "전기", icon: "ph ph-lightning" },
  grass: { ko: "풀", icon: "ph ph-leaf" },
  ice: { ko: "얼음", icon: "ph ph-snowflake" },
  fighting: { ko: "격투", icon: "ph ph-sword" },
  poison: { ko: "독", icon: "ph ph-skull" },
  ground: { ko: "땅", icon: "ph ph-mountains" },
  flying: { ko: "비행", icon: "ph ph-wind" },
  psychic: { ko: "에스퍼", icon: "ph ph-eye" },
  bug: { ko: "벌레", icon: "ph ph-bug" },
  rock: { ko: "바위", icon: "ph ph-diamond" },
  ghost: { ko: "고스트", icon: "ph ph-ghost" },
  dragon: { ko: "드래곤", icon: "ph ph-dragon" },
  dark: { ko: "악", icon: "ph ph-moon" },
  steel: { ko: "강철", icon: "ph ph-nut" },
  fairy: { ko: "페어리", icon: "ph ph-sparkles" }
};

// Stat Label translations
const STAT_TRANSLATIONS = {
  hp: "HP",
  attack: "공격",
  defense: "방어",
  "special-attack": "특공",
  "special-defense": "특방",
  speed: "스피드"
};

// DOM Elements
const pokedexGrid = document.getElementById("pokedex-grid");
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const registeredCountSpan = document.getElementById("registered-count");
const loader = document.getElementById("loader");
const noResults = document.getElementById("no-results");
const resetFiltersBtn = document.getElementById("reset-filters-btn");

// Dropdowns
const dropdowns = {
  type: {
    btn: document.getElementById("type-select-btn"),
    menu: document.getElementById("type-dropdown-menu"),
    value: "all"
  },
  gen: {
    btn: document.getElementById("gen-select-btn"),
    menu: document.getElementById("gen-dropdown-menu"),
    value: "all"
  },
  sort: {
    btn: document.getElementById("sort-select-btn"),
    menu: document.getElementById("sort-dropdown-menu"),
    value: "id-asc"
  }
};

// Detail Modal Elements
const modal = document.getElementById("detail-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalPrevBtn = document.getElementById("modal-prev-btn");
const modalCryBtn = document.getElementById("modal-cry-btn");
const modalPokemonId = document.getElementById("modal-pokemon-id");
const modalPokemonName = document.getElementById("modal-pokemon-name");
const modalPokemonImg = document.getElementById("modal-pokemon-img");
const modalPokemonTypes = document.getElementById("modal-pokemon-types");
const modalPokemonDesc = document.getElementById("modal-pokemon-desc");
const modalPokemonHeight = document.getElementById("modal-pokemon-height");
const modalPokemonWeight = document.getElementById("modal-pokemon-weight");
const modalPokemonAbilities = document.getElementById("modal-pokemon-abilities");
const modalStatsList = document.getElementById("modal-stats-list");
const modalEvolutionChain = document.getElementById("modal-evolution-chain");
const modalGlowLayer = document.getElementById("modal-glow-layer");

// ==========================================================================
// Initialization & Loading Data
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  renderSkeletons();
  setupDropdownListeners();
  setupSearchListeners();
  setupInfiniteScroll();
  setupModalListeners();

  try {
    const response = await fetch("pokemon_names.json");
    if (!response.ok) throw new Error("데이터를 가져오는 데 실패했습니다.");
    
    pokemonList = await response.json();
    registeredCountSpan.textContent = pokemonList.length;
    
    // Build Type Dropdown Menu dynamically
    buildTypeDropdown();
    
    // Apply initial filtering and rendering
    applyFilters();
  } catch (err) {
    console.error("Initialization error:", err);
    pokedexGrid.innerHTML = `<p class="error-msg">데이터 로드 실패: ${err.message}</p>`;
  }
}

// Render skeleton loaders during initial wait
function renderSkeletons() {
  pokedexGrid.innerHTML = "";
  for (let i = 0; i < itemsPerPage; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-card glass-panel";
    skeleton.innerHTML = `
      <div class="skeleton-element skeleton-id"></div>
      <div class="skeleton-element skeleton-img"></div>
      <div class="skeleton-element skeleton-name"></div>
      <div class="skeleton-element skeleton-types"></div>
    `;
    pokedexGrid.appendChild(skeleton);
  }
}

// Build type list options inside dropdown menu
function buildTypeDropdown() {
  const menu = dropdowns.type.menu;
  menu.innerHTML = `<div class="dropdown-item active" data-type="all">
    <i class="ph ph-sparkles"></i> 모든 타입
  </div>`;
  
  Object.keys(TYPE_DETAILS).forEach(key => {
    const type = TYPE_DETAILS[key];
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.setAttribute("data-type", key);
    item.innerHTML = `<i class="${type.icon}"></i> ${type.ko}`;
    menu.appendChild(item);
  });

  // Re-attach listeners to newly created items
  menu.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const selectedItem = e.currentTarget;
      menu.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
      selectedItem.classList.add("active");
      
      dropdowns.type.value = selectedItem.getAttribute("data-type");
      dropdowns.type.btn.querySelector(".btn-content").innerHTML = selectedItem.innerHTML;
      
      menu.classList.add("hidden");
      dropdowns.type.btn.classList.remove("active");
      
      applyFilters();
    });
  });
}

// ==========================================================================
// Dropdowns and Interactive Controls
// ==========================================================================
function setupDropdownListeners() {
  // Toggle dropdown visibility
  Object.keys(dropdowns).forEach(key => {
    const d = dropdowns[key];
    d.btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close other dropdowns
      Object.keys(dropdowns).forEach(k => {
        if (k !== key) {
          dropdowns[k].menu.classList.add("hidden");
          dropdowns[k].btn.classList.remove("active");
        }
      });
      d.menu.classList.toggle("hidden");
      d.btn.classList.toggle("active");
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    Object.keys(dropdowns).forEach(k => {
      dropdowns[k].menu.classList.add("hidden");
      dropdowns[k].btn.classList.remove("active");
    });
  });

  // Listen for items in Generation and Sorting dropdowns (which are static in HTML)
  dropdowns.gen.menu.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const selectedItem = e.currentTarget;
      dropdowns.gen.menu.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
      selectedItem.classList.add("active");
      
      dropdowns.gen.value = selectedItem.getAttribute("data-gen");
      dropdowns.gen.btn.querySelector(".btn-content").innerHTML = selectedItem.innerHTML;
      
      dropdowns.gen.menu.classList.add("hidden");
      dropdowns.gen.btn.classList.remove("active");
      
      applyFilters();
    });
  });

  dropdowns.sort.menu.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const selectedItem = e.currentTarget;
      dropdowns.sort.menu.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
      selectedItem.classList.add("active");
      
      dropdowns.sort.value = selectedItem.getAttribute("data-sort");
      dropdowns.sort.btn.querySelector(".btn-content").innerHTML = selectedItem.innerHTML;
      
      dropdowns.sort.menu.classList.add("hidden");
      dropdowns.sort.btn.classList.remove("active");
      
      applyFilters();
    });
  });

  // Reset Filters Button
  resetFiltersBtn.addEventListener("click", resetAllFilters);
}

function resetAllFilters() {
  searchInput.value = "";
  clearSearchBtn.classList.add("hidden");
  
  // Reset Type Filter
  dropdowns.type.value = "all";
  const typeAllItem = dropdowns.type.menu.querySelector('[data-type="all"]');
  dropdowns.type.menu.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
  if (typeAllItem) typeAllItem.classList.add("active");
  dropdowns.type.btn.querySelector(".btn-content").innerHTML = `<i class="ph ph-sparkles"></i> 모든 타입`;

  // Reset Gen Filter
  dropdowns.gen.value = "all";
  const genAllItem = dropdowns.gen.menu.querySelector('[data-gen="all"]');
  dropdowns.gen.menu.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
  if (genAllItem) genAllItem.classList.add("active");
  dropdowns.gen.btn.querySelector(".btn-content").innerHTML = `<i class="ph ph-globe-hemisphere-east"></i> 모든 세대`;

  // Reset Sort Filter
  dropdowns.sort.value = "id-asc";
  const sortAscItem = dropdowns.sort.menu.querySelector('[data-sort="id-asc"]');
  dropdowns.sort.menu.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
  if (sortAscItem) sortAscItem.classList.add("active");
  dropdowns.sort.btn.querySelector(".btn-content").innerHTML = `<i class="ph ph-sort-ascending"></i> 번호 순 (오름차순)`;

  applyFilters();
}

// Search field listeners
function setupSearchListeners() {
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val.length > 0) {
      clearSearchBtn.classList.remove("hidden");
    } else {
      clearSearchBtn.classList.add("hidden");
    }
    applyFilters();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.classList.add("hidden");
    applyFilters();
  });
}

// ==========================================================================
// Filtering and Sorting Algorithm
// ==========================================================================
function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const typeFilter = dropdowns.type.value;
  const genFilter = dropdowns.gen.value;
  const sortFilter = dropdowns.sort.value;

  filteredList = pokemonList.filter(pokemon => {
    // 1. Search Query Match (by ID, Korean name, or English name)
    const matchesQuery = 
      pokemon.id.toString().includes(query) ||
      pokemon.ko.toLowerCase().includes(query) ||
      pokemon.en.toLowerCase().includes(query);

    // 2. Type Filter Match
    const matchesType = typeFilter === "all" || pokemon.types.includes(typeFilter);

    // 3. Generation Filter Match
    const matchesGen = genFilter === "all" || pokemon.gen.toString() === genFilter;

    return matchesQuery && matchesType && matchesGen;
  });

  // 4. Sort results
  if (sortFilter === "id-asc") {
    filteredList.sort((a, b) => a.id - b.id);
  } else if (sortFilter === "id-desc") {
    filteredList.sort((a, b) => b.id - a.id);
  } else if (sortFilter === "name-asc") {
    filteredList.sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));
  } else if (sortFilter === "name-desc") {
    filteredList.sort((a, b) => b.ko.localeCompare(a.ko, 'ko'));
  }

  // Reset pagination
  loadedCount = itemsPerPage;
  renderGrid(false);
}

// ==========================================================================
// Grid Rendering
// ==========================================================================
function renderGrid(append = false) {
  if (!append) {
    pokedexGrid.innerHTML = "";
  }

  if (filteredList.length === 0) {
    noResults.classList.remove("hidden");
    return;
  }
  noResults.classList.add("hidden");

  const startIdx = append ? pokedexGrid.children.length : 0;
  const endIdx = Math.min(startIdx + itemsPerPage, filteredList.length);

  for (let i = startIdx; i < endIdx; i++) {
    const pokemon = filteredList[i];
    const card = document.createElement("div");
    
    // Dominant type mapping for dynamic glows
    const primaryType = pokemon.types[0];
    card.className = "pokemon-card glass-panel";
    card.setAttribute("data-id", pokemon.id);
    card.style.setProperty('--card-glow-color', `hsl(var(--type-${primaryType}-hsl))`);
    
    // Add custom style for card hover glows
    card.addEventListener("mouseenter", () => {
      card.style.boxShadow = `0 12px 28px rgba(0, 0, 0, 0.4), 0 0 18px rgba(var(--type-${primaryType}-hsl), 0.25)`;
      card.style.borderColor = `rgba(var(--type-${primaryType}-hsl), 0.4)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.boxShadow = '';
      card.style.borderColor = '';
    });

    const paddedId = pokemon.id.toString().padStart(4, "0");
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;

    // Type Badge Elements
    const badgesHtml = pokemon.types.map(type => {
      const typeInfo = TYPE_DETAILS[type] || { ko: type, icon: "ph ph-sparkles" };
      return `<span class="type-badge type-${type}"><i class="${typeInfo.icon}"></i> ${typeInfo.ko}</span>`;
    }).join("");

    card.innerHTML = `
      <span class="card-id">#${paddedId}</span>
      <div class="card-img-wrapper">
        <div class="card-img-bg" style="background-color: hsl(var(--type-${primaryType}-hsl))"></div>
        <img src="${imageUrl}" alt="${pokemon.ko}" class="card-img" loading="lazy">
      </div>
      <h3 class="card-name">${pokemon.ko}</h3>
      <div class="card-types">
        ${badgesHtml}
      </div>
    `;

    // Click card opens modal
    card.addEventListener("click", () => {
      openDetailModal(pokemon.id);
    });

    pokedexGrid.appendChild(card);
  }
}

// Setup Infinite Scrolling
function setupInfiniteScroll() {
  window.addEventListener("scroll", () => {
    if (loadedCount >= filteredList.length) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // Load next batch when 150px close to bottom
    if (scrollTop + clientHeight >= scrollHeight - 150) {
      loader.classList.remove("hidden");
      
      // Artificial delay for premium loading flow
      setTimeout(() => {
        loadedCount += itemsPerPage;
        renderGrid(true);
        loader.classList.add("hidden");
      }, 350);
    }
  });
}

// ==========================================================================
// Immersive Details Modal
// ==========================================================================
function setupModalListeners() {
  modalCloseBtn.addEventListener("click", closeDetailModal);
  
  // Click overlay to close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDetailModal();
  });

  // Prev Pokemon Button
  modalPrevBtn.addEventListener("click", () => {
    const currentIndex = filteredList.findIndex(p => p.id === activePokemonId);
    if (currentIndex > 0) {
      openDetailModal(filteredList[currentIndex - 1].id);
    }
  });

  // Speaker Cry Audio Button
  modalCryBtn.addEventListener("click", playPokemonCry);
}

function closeDetailModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = ""; // restore body scroll
  activePokemonId = null;
  
  if (currentAudio) {
    currentAudio.pause();
    modalCryBtn.classList.remove("cry-playing");
  }
}

async function openDetailModal(id) {
  activePokemonId = id;
  document.body.style.overflow = "hidden"; // lock scroll
  modal.classList.remove("hidden");
  
  // Show navigation button state
  const currentIndex = filteredList.findIndex(p => p.id === id);
  if (currentIndex === 0) {
    modalPrevBtn.style.visibility = "hidden";
  } else {
    modalPrevBtn.style.visibility = "visible";
  }

  // Pre-fill card metadata from our preloaded pokemonList
  const pokemonInfo = pokemonList.find(p => p.id === id);
  const paddedId = id.toString().padStart(4, "0");
  
  modalPokemonId.textContent = `#${paddedId}`;
  modalPokemonName.textContent = pokemonInfo ? pokemonInfo.ko : `포켓몬 #${paddedId}`;
  
  // Set images & type glows instantly
  const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  modalPokemonImg.src = imageUrl;
  
  const primaryType = pokemonInfo ? pokemonInfo.types[0] : "normal";
  modalGlowLayer.style.background = `radial-gradient(circle, rgba(var(--type-${primaryType}-hsl), 0.45) 0%, rgba(var(--type-${primaryType}-hsl), 0) 70%)`;
  
  // Render loading states for dynamic data fields
  modalPokemonTypes.innerHTML = '<span class="skeleton-element skeleton-types"></span>';
  modalPokemonDesc.textContent = "도감 설명을 불러오는 중입니다...";
  modalPokemonHeight.textContent = "-- m";
  modalPokemonWeight.textContent = "-- kg";
  modalPokemonAbilities.textContent = "불러오는 중...";
  modalStatsList.innerHTML = '<div class="loader-container"><div class="pokeball-spinner"></div></div>';
  modalEvolutionChain.innerHTML = '<div class="loader-container"><div class="pokeball-spinner"></div></div>';

  try {
    const data = await fetchPokemonDetails(id);
    renderModalDetails(data);
  } catch (err) {
    console.error("Error loading modal details:", err);
    modalPokemonDesc.textContent = "상세 정보를 가져오는 중 에러가 발생했습니다.";
  }
}

// Fetch species and additional info from cache or direct endpoint
async function fetchPokemonDetails(id) {
  if (detailsCache.has(id)) {
    return detailsCache.get(id);
  }

  // Fetch parallel details
  const [pokemonRes, speciesRes] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`),
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`)
  ]);

  if (!pokemonRes.ok || !speciesRes.ok) {
    throw new Error("상세 정보를 가져오는 과정에서 오류가 발생했습니다.");
  }

  const pokemonData = await pokemonRes.json();
  const speciesData = await speciesRes.json();

  // Fetch evolution chain data
  let evolutionData = null;
  if (speciesData.evolution_chain && speciesData.evolution_chain.url) {
    const evoRes = await fetch(speciesData.evolution_chain.url);
    if (evoRes.ok) {
      evolutionData = await evoRes.json();
    }
  }

  const combinedDetails = {
    pokemon: pokemonData,
    species: speciesData,
    evolution: evolutionData
  };

  // Save to Cache
  detailsCache.set(id, combinedDetails);
  return combinedDetails;
}

// Render dynamic modal contents
function renderModalDetails(data) {
  const { pokemon, species, evolution } = data;

  // Types Badges
  const badgesHtml = pokemon.types.map(t => {
    const typeInfo = TYPE_DETAILS[t.type.name] || { ko: t.type.name, icon: "ph ph-sparkles" };
    return `<span class="type-badge type-${t.type.name}"><i class="${typeInfo.icon}"></i> ${typeInfo.ko}</span>`;
  }).join("");
  modalPokemonTypes.innerHTML = badgesHtml;

  // Height & Weight translation (Decimeters to Meters, Hectograms to Kilograms)
  modalPokemonHeight.textContent = `${(pokemon.height / 10).toFixed(1)} m`;
  modalPokemonWeight.textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;

  // Abilities (PokeAPI has them in English. If we want translation, we can load them.
  // For standard simplicity, we can fetch English abilities and capitalize them.
  // To make it feel premium, we can fetch Korean translation if available, or fetch ability description.
  // Let's capitalize them and list them)
  const abilitiesStr = pokemon.abilities
    .map(a => a.ability.name.replace("-", " ").toUpperCase())
    .join(" / ");
  modalPokemonAbilities.textContent = abilitiesStr;

  // Description / Flavor Text (Search for Korean text)
  const koFlavorText = species.flavor_text_entries.find(entry => entry.language.name === "ko");
  // Clean description text (remove special layout formatting characters)
  const cleanDesc = koFlavorText 
    ? koFlavorText.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ").replace(/\r/g, " ") 
    : "도감 설명이 존재하지 않습니다. (English description fallback: " + 
      (species.flavor_text_entries.find(entry => entry.language.name === "en")?.flavor_text.replace(/\n/g, " ") || "") + ")";
  modalPokemonDesc.textContent = cleanDesc;

  // Cries Audio source configuration
  if (pokemon.cries && pokemon.cries.latest) {
    modalCryBtn.style.display = "flex";
  } else {
    modalCryBtn.style.display = "none";
  }

  // Base Stats list rendering
  modalStatsList.innerHTML = "";
  pokemon.stats.forEach(s => {
    const name = STAT_TRANSLATIONS[s.stat.name] || s.stat.name.toUpperCase();
    const val = s.base_stat;
    const percentage = Math.min((val / 255) * 100, 100); // base stats max is approx 255
    
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <span class="stat-label">${name}</span>
      <span class="stat-value">${val}</span>
      <div class="stat-bar-container">
        <div class="stat-bar" style="width: 0%"></div>
      </div>
    `;
    
    modalStatsList.appendChild(row);

    // Staggered animate width loading
    setTimeout(() => {
      const bar = row.querySelector(".stat-bar");
      if (bar) bar.style.width = `${percentage}%`;
    }, 100);
  });

  // Evolution chain rendering
  renderEvolutionChain(evolution);
}

// Render the graphical evolution flow
function renderEvolutionChain(evolutionData) {
  modalEvolutionChain.innerHTML = "";
  if (!evolutionData || !evolutionData.chain) {
    modalEvolutionChain.textContent = "진화 정보가 존재하지 않습니다.";
    return;
  }

  const flowContainer = document.createElement("div");
  flowContainer.className = "evolution-chain-flow";
  
  // Flatten tree to display nodes in sequence
  const stages = [];
  let currentLink = evolutionData.chain;

  // Recursive parser to collect nodes
  function traverseChain(link) {
    if (!link) return;
    
    const urlParts = link.species.url.split('/');
    const id = parseInt(urlParts[urlParts.length - 2]);
    
    // Find preloaded names
    const preInfo = pokemonList.find(p => p.id === id);
    const name = preInfo ? preInfo.ko : link.species.name;
    const types = preInfo ? preInfo.types : ["normal"];

    // Find trigger details
    let trigger = "";
    if (link.evolution_details && link.evolution_details.length > 0) {
      const details = link.evolution_details[0];
      if (details.min_level) {
        trigger = `Lv.${details.min_level}`;
      } else if (details.item) {
        // Translation for items if possible, otherwise capitalise
        trigger = details.item.name.replace("-", " ").toUpperCase();
      } else if (details.min_happiness) {
        trigger = "친밀도";
      } else if (details.time_of_day) {
        trigger = details.time_of_day === "day" ? "낮" : "밤";
      } else if (details.location) {
        trigger = "특정 장소";
      } else if (details.known_move) {
        trigger = "특정 기술 습득";
      } else {
        trigger = "진화";
      }
    }

    stages.push({ id, name, types, trigger });

    // Handles simple lines, for branches like Eevee we just follow the first branch for sequencing 
    // but we can add arrows for additional branches.
    if (link.evolves_to && link.evolves_to.length > 0) {
      // If there are multiple branches, we traverse each.
      // For standard display, let's build branching groups
      if (link.evolves_to.length > 1) {
        // Multi branch evolution (like Eevee, Tyrogue, Wurmple)
        const branches = link.evolves_to.map(child => {
          const childUrlParts = child.species.url.split('/');
          const childId = parseInt(childUrlParts[childUrlParts.length - 2]);
          const childPre = pokemonList.find(p => p.id === childId);
          
          let childTrigger = "진화";
          if (child.evolution_details && child.evolution_details.length > 0) {
            const details = child.evolution_details[0];
            if (details.min_level) childTrigger = `Lv.${details.min_level}`;
            else if (details.item) childTrigger = details.item.name.replace("-", " ").toUpperCase();
            else if (details.held_item) childTrigger = `도구 장착`;
          }
          return {
            id: childId,
            name: childPre ? childPre.ko : child.species.name,
            types: childPre ? childPre.types : ["normal"],
            trigger: childTrigger
          };
        });
        stages.push({ isBranch: true, branches });
      } else {
        traverseChain(link.evolves_to[0]);
      }
    }
  }

  traverseChain(currentLink);

  // Render HTML based on collected stages
  stages.forEach((stage, idx) => {
    // If it's a branch group
    if (stage.isBranch) {
      const branchWrapper = document.createElement("div");
      branchWrapper.style.display = "flex";
      branchWrapper.style.flexDirection = "column";
      branchWrapper.style.gap = "8px";

      stage.branches.forEach(branch => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "12px";

        const arrow = document.createElement("div");
        arrow.className = "evo-arrow";
        arrow.innerHTML = `<i class="ph ph-arrow-right"></i><span class="evo-trigger">${branch.trigger}</span>`;

        const node = createEvoNode(branch);
        row.appendChild(arrow);
        row.appendChild(node);
        branchWrapper.appendChild(row);
      });
      flowContainer.appendChild(branchWrapper);
    } else {
      // Normal node
      if (idx > 0) {
        const arrow = document.createElement("div");
        arrow.className = "evo-arrow";
        arrow.innerHTML = `<i class="ph ph-arrow-right"></i><span class="evo-trigger">${stage.trigger || "진화"}</span>`;
        flowContainer.appendChild(arrow);
      }
      const node = createEvoNode(stage);
      flowContainer.appendChild(node);
    }
  });

  modalEvolutionChain.appendChild(flowContainer);
}

// Helper to create click-active evolution card nodes
function createEvoNode(stage) {
  const node = document.createElement("div");
  node.className = "evo-node";
  const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${stage.id}.png`;
  
  node.innerHTML = `
    <div class="evo-img-wrapper">
      <img src="${imgUrl}" alt="${stage.name}" loading="lazy">
    </div>
    <span class="evo-name">${stage.name}</span>
  `;

  // Make evolution nodes clickable to navigate directly inside the modal
  node.addEventListener("click", (e) => {
    e.stopPropagation();
    openDetailModal(stage.id);
  });

  return node;
}

// Cry Sound Player
async function playPokemonCry() {
  if (activePokemonId === null) return;
  
  const cacheData = detailsCache.get(activePokemonId);
  if (!cacheData || !cacheData.pokemon.cries || !cacheData.pokemon.cries.latest) return;

  const cryUrl = cacheData.pokemon.cries.latest;

  if (currentAudio) {
    currentAudio.pause();
    modalCryBtn.classList.remove("cry-playing");
  }

  modalCryBtn.classList.add("cry-playing");
  currentAudio = new Audio(cryUrl);
  currentAudio.volume = 0.45; // slightly lower volume for safety

  currentAudio.addEventListener("ended", () => {
    modalCryBtn.classList.remove("cry-playing");
  });

  try {
    await currentAudio.play();
  } catch (err) {
    console.error("Audio playback error:", err);
    modalCryBtn.classList.remove("cry-playing");
  }
}
