// ==========================================================================
// Pokémon Pokedex (PokéVerse) Core JavaScript - Binance Redesign & I18n
// ==========================================================================

// Global App State
let pokemonList = [];           // Raw loaded list from pokemon_names.json
let filteredList = [];          // List after applying search, type, and gen filters
let loadedCount = 24;           // Number of currently rendered cards
const itemsPerPage = 24;
const detailsCache = new Map(); // Cache for detailed Pokemon data (modal)
let activePokemonId = null;      // Currently selected pokemon in modal
let currentAudio = null;         // Active Audio instance playing cry
let currentLang = "ko";          // UI Language state: "ko" or "en"

// Translation Dictionary
const TRANSLATIONS = {
  ko: {
    title: "PokéVerse - 바이낸스 스타일 포켓몬 도감",
    registeredLabel: "등록됨",
    searchPlaceholder: "이름 또는 도감 번호 검색...",
    allTypes: "모든 타입",
    allGens: "모든 세대",
    sortIdAsc: "번호 순 (오름차순)",
    sortIdDesc: "번호 순 (내림차순)",
    sortNameAsc: "이름 순 (ㄱ-ㅎ)",
    sortNameDesc: "이름 순 (ㅎ-ㄱ)",
    genLabels: {
      all: "모든 세대",
      1: "제1세대 (관동)",
      2: "제2세대 (성도)",
      3: "제3세대 (호연)",
      4: "제4세대 (신오)",
      5: "제5세대 (하나)",
      6: "제6세대 (칼로스)",
      7: "제7세대 (알로라)",
      8: "제8세대 (가라르)",
      9: "제9세대 (팔데아)"
    },
    loading: "포켓몬 데이터를 불러오는 중...",
    noResultsTitle: "검색 결과가 없습니다.",
    noResultsDesc: "이름이나 도감 번호를 올바르게 입력했는지 확인해 주세요.",
    resetFilters: "필터 초기화",
    height: "키 (Height)",
    weight: "몸무게 (Weight)",
    abilities: "특성 (Abilities)",
    baseStats: "기본 능력치 (Base Stats)",
    evolutionChain: "진화 과정 (Evolution Chain)",
    prevBtn: "이전 포켓몬",
    cryBtn: "울음소리 듣기",
    closeBtn: "닫기",
    evoTrigger: {
      level: "Lv.",
      item: "도구",
      happiness: "친밀도",
      timeDay: "낮",
      timeNight: "밤",
      location: "특정 장소",
      move: "기술 습득",
      evolve: "진화"
    }
  },
  en: {
    title: "PokéVerse - Binance Style Pokédex",
    registeredLabel: "Registered",
    searchPlaceholder: "Search name or ID...",
    allTypes: "All Types",
    allGens: "All Generations",
    sortIdAsc: "ID (Ascending)",
    sortIdDesc: "ID (Descending)",
    sortNameAsc: "Name (A-Z)",
    sortNameDesc: "Name (Z-A)",
    genLabels: {
      all: "All Generations",
      1: "Gen I (Kanto)",
      2: "Gen II (Johto)",
      3: "Gen III (Hoenn)",
      4: "Gen IV (Sinnoh)",
      5: "Gen V (Unova)",
      6: "Gen VI (Kalos)",
      7: "Gen VII (Alola)",
      8: "Gen VIII (Galar)",
      9: "Gen IX (Paldea)"
    },
    loading: "Loading Pokémon data...",
    noResultsTitle: "No results found.",
    noResultsDesc: "Please check if you entered the name or ID correctly.",
    resetFilters: "Reset Filters",
    height: "Height",
    weight: "Weight",
    abilities: "Abilities",
    baseStats: "Base Stats",
    evolutionChain: "Evolution Chain",
    prevBtn: "Previous Pokémon",
    cryBtn: "Play Cry Sound",
    closeBtn: "Close",
    evoTrigger: {
      level: "Lv.",
      item: "Item",
      happiness: "Happiness",
      timeDay: "Day",
      timeNight: "Night",
      location: "Location",
      move: "Learn Move",
      evolve: "Evolve"
    }
  }
};

// PokeAPI Type Translation and Icons mapping
const TYPE_DETAILS = {
  normal: { ko: "노말", en: "Normal", icon: "ph ph-circle" },
  fire: { ko: "불꽃", en: "Fire", icon: "ph ph-flame" },
  water: { ko: "물", en: "Water", icon: "ph ph-drop" },
  electric: { ko: "전기", en: "Electric", icon: "ph ph-lightning" },
  grass: { ko: "풀", en: "Grass", icon: "ph ph-leaf" },
  ice: { ko: "얼음", en: "Ice", icon: "ph ph-snowflake" },
  fighting: { ko: "격투", en: "Fighting", icon: "ph ph-sword" },
  poison: { ko: "독", en: "Poison", icon: "ph ph-skull" },
  ground: { ko: "땅", en: "Ground", icon: "ph ph-mountains" },
  flying: { ko: "비행", en: "Flying", icon: "ph ph-wind" },
  psychic: { ko: "에스퍼", en: "Psychic", icon: "ph ph-eye" },
  bug: { ko: "벌레", en: "Bug", icon: "ph ph-bug" },
  rock: { ko: "바위", en: "Rock", icon: "ph ph-diamond" },
  ghost: { ko: "고스트", en: "Ghost", icon: "ph ph-ghost" },
  dragon: { ko: "드래곤", en: "Dragon", icon: "ph ph-dragon" },
  dark: { ko: "악", en: "Dark", icon: "ph ph-moon" },
  steel: { ko: "강철", en: "Steel", icon: "ph ph-nut" },
  fairy: { ko: "페어리", en: "Fairy", icon: "ph ph-sparkles" }
};

// Stat Label translations
const STAT_TRANSLATIONS = {
  ko: {
    hp: "HP",
    attack: "공격",
    defense: "방어",
    "special-attack": "특공",
    "special-defense": "특방",
    speed: "스피드"
  },
  en: {
    hp: "HP",
    attack: "ATK",
    defense: "DEF",
    "special-attack": "SP. ATK",
    "special-defense": "SP. DEF",
    speed: "SPD"
  }
};

// HSL mappings for Type Badge calculations (retaining HSL values in JS code)
const TYPE_HSL_MAP = {
  normal: "208, 9%, 60%",
  fire: "11, 100%, 60%",
  water: "210, 95%, 58%",
  electric: "48, 100%, 54%",
  grass: "156, 76%, 47%",
  ice: "182, 100%, 65%",
  fighting: "355, 80%, 53%",
  poison: "284, 63%, 58%",
  ground: "33, 75%, 60%",
  flying: "228, 100%, 78%",
  psychic: "340, 100%, 65%",
  bug: "76, 77%, 40%",
  rock: "45, 45%, 57%",
  ghost: "253, 50%, 56%",
  dragon: "248, 100%, 61%",
  dark: "220, 13%, 31%",
  steel: "196, 36%, 57%",
  fairy: "332, 100%, 73%"
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
  setupLanguageListeners();
  setupDropdownListeners();
  setupSearchListeners();
  setupInfiniteScroll();
  setupModalListeners();

  try {
    const response = await fetch("pokemon_names.json");
    if (!response.ok) throw new Error("데이터를 가져오는 데 실패했습니다.");
    
    pokemonList = await response.json();
    registeredCountSpan.textContent = pokemonList.length;
    
    // Set HSL CSS variables for badge colors dynamically
    Object.keys(TYPE_HSL_MAP).forEach(key => {
      document.documentElement.style.setProperty(`--type-${key}-hsl`, TYPE_HSL_MAP[key]);
    });
    
    // Translate structural UI elements and generate language-specific lists
    translateUI();
    buildTypeDropdown();
    buildGenerationDropdown();
    buildSortingDropdown();
    
    // Apply filters and start grid render
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
    skeleton.className = "skeleton-card";
    skeleton.innerHTML = `
      <div class="skeleton-element skeleton-id"></div>
      <div class="skeleton-element skeleton-img"></div>
      <div class="skeleton-element skeleton-name"></div>
      <div class="skeleton-element skeleton-types"></div>
    `;
    pokedexGrid.appendChild(skeleton);
  }
}

// ==========================================================================
// Language Switching (I18n Translation Layer)
// ==========================================================================
function setupLanguageListeners() {
  const koBtn = document.getElementById("lang-ko-btn");
  const enBtn = document.getElementById("lang-en-btn");

  koBtn.addEventListener("click", () => {
    if (currentLang === "ko") return;
    currentLang = "ko";
    koBtn.classList.add("active");
    enBtn.classList.remove("active");
    handleLanguageChange();
  });

  enBtn.addEventListener("click", () => {
    if (currentLang === "en") return;
    currentLang = "en";
    enBtn.classList.add("active");
    koBtn.classList.remove("active");
    handleLanguageChange();
  });
}

function handleLanguageChange() {
  // 1. Translate UI static elements
  translateUI();
  
  // 2. Re-create generation and sorting dropdown items in current language
  buildTypeDropdown();
  buildGenerationDropdown();
  buildSortingDropdown();
  
  // 3. Re-render grids
  applyFilters();

  // 4. Re-open detail modal if currently displayed
  if (activePokemonId !== null) {
    openDetailModal(activePokemonId);
  }
}

function translateUI() {
  const trans = TRANSLATIONS[currentLang];
  
  // Document title
  document.title = trans.title;
  
  // Header Elements
  document.getElementById("registered-label").textContent = trans.registeredLabel;
  
  // Search Input placeholder
  searchInput.placeholder = trans.searchPlaceholder;
  
  // Loader Text
  document.getElementById("loader-text").textContent = trans.loading;
  
  // No Results Elements
  document.getElementById("no-results-title").textContent = trans.noResultsTitle;
  document.getElementById("no-results-desc").textContent = trans.noResultsDesc;
  document.getElementById("reset-filters-btn").textContent = trans.resetFilters;

  // Modal static labels
  document.getElementById("modal-height-label").textContent = trans.height;
  document.getElementById("modal-weight-label").textContent = trans.weight;
  document.getElementById("modal-abilities-label").textContent = trans.abilities;
  document.getElementById("modal-stats-title").innerHTML = `<i class="ph ph-chart-bar"></i> ${trans.baseStats}`;
  document.getElementById("modal-evolution-title").innerHTML = `<i class="ph ph-tree-structure"></i> ${trans.evolutionChain}`;
  
  // Modal nav tips
  modalPrevBtn.title = trans.prevBtn;
  modalCryBtn.title = trans.cryBtn;
  modalCloseBtn.title = trans.closeBtn;
}

// Build type list options inside dropdown menu dynamically
function buildTypeDropdown() {
  const menu = dropdowns.type.menu;
  const trans = TRANSLATIONS[currentLang];
  
  const currentVal = dropdowns.type.value;
  
  menu.innerHTML = `<div class="dropdown-item ${currentVal === "all" ? "active" : ""}" data-type="all">
    <i class="ph ph-sparkles"></i> ${trans.allTypes}
  </div>`;
  
  Object.keys(TYPE_DETAILS).forEach(key => {
    const type = TYPE_DETAILS[key];
    const isActive = currentVal === key;
    const item = document.createElement("div");
    item.className = `dropdown-item ${isActive ? "active" : ""}`;
    item.setAttribute("data-type", key);
    item.innerHTML = `<i class="${type.icon}"></i> ${type[currentLang]}`;
    menu.appendChild(item);
  });

  // Attach dropdown select listeners
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
  
  // Set current selected text in button
  const currentSelected = menu.querySelector(".dropdown-item.active");
  if (currentSelected) {
    dropdowns.type.btn.querySelector(".btn-content").innerHTML = currentSelected.innerHTML;
  }
}

function buildGenerationDropdown() {
  const menu = dropdowns.gen.menu;
  const trans = TRANSLATIONS[currentLang];
  const currentVal = dropdowns.gen.value;
  
  menu.innerHTML = "";
  Object.keys(trans.genLabels).forEach(key => {
    const item = document.createElement("div");
    const isActive = currentVal === key;
    item.className = `dropdown-item ${isActive ? "active" : ""}`;
    item.setAttribute("data-gen", key);
    item.textContent = trans.genLabels[key];
    menu.appendChild(item);
  });

  // Attach select listeners
  menu.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const selectedItem = e.currentTarget;
      menu.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
      selectedItem.classList.add("active");
      
      dropdowns.gen.value = selectedItem.getAttribute("data-gen");
      dropdowns.gen.btn.querySelector(".btn-content").innerHTML = selectedItem.innerHTML;
      
      menu.classList.add("hidden");
      dropdowns.gen.btn.classList.remove("active");
      
      applyFilters();
    });
  });

  const currentSelected = menu.querySelector(".dropdown-item.active");
  if (currentSelected) {
    dropdowns.gen.btn.querySelector(".btn-content").innerHTML = currentSelected.innerHTML;
  }
}

function buildSortingDropdown() {
  const menu = dropdowns.sort.menu;
  const trans = TRANSLATIONS[currentLang];
  const currentVal = dropdowns.sort.value;

  menu.innerHTML = "";
  const items = [
    { key: "id-asc", label: trans.sortIdAsc, icon: "ph ph-sort-ascending" },
    { key: "id-desc", label: trans.sortIdDesc, icon: "ph ph-sort-descending" },
    { key: "name-asc", label: trans.sortNameAsc, icon: "ph ph-sort-ascending" },
    { key: "name-desc", label: trans.sortNameDesc, icon: "ph ph-sort-descending" }
  ];

  items.forEach(item => {
    const div = document.createElement("div");
    const isActive = currentVal === item.key;
    div.className = `dropdown-item ${isActive ? "active" : ""}`;
    div.setAttribute("data-sort", item.key);
    div.innerHTML = `<i class="${item.icon}"></i> ${item.label}`;
    menu.appendChild(div);
  });

  // Attach click listener
  menu.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const selectedItem = e.currentTarget;
      menu.querySelectorAll(".dropdown-item").forEach(i => i.classList.remove("active"));
      selectedItem.classList.add("active");
      
      dropdowns.sort.value = selectedItem.getAttribute("data-sort");
      dropdowns.sort.btn.querySelector(".btn-content").innerHTML = selectedItem.innerHTML;
      
      menu.classList.add("hidden");
      dropdowns.sort.btn.classList.remove("active");
      
      applyFilters();
    });
  });

  const currentSelected = menu.querySelector(".dropdown-item.active");
  if (currentSelected) {
    dropdowns.sort.btn.querySelector(".btn-content").innerHTML = currentSelected.innerHTML;
  }
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

  // Reset Filters Button
  resetFiltersBtn.addEventListener("click", resetAllFilters);
}

function resetAllFilters() {
  searchInput.value = "";
  clearSearchBtn.classList.add("hidden");
  
  // Reset values and active states in dropdowns
  dropdowns.type.value = "all";
  dropdowns.gen.value = "all";
  dropdowns.sort.value = "id-asc";

  buildTypeDropdown();
  buildGenerationDropdown();
  buildSortingDropdown();

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

  // 4. Sort results (Name sorting respects Korean locale or English A-Z)
  if (sortFilter === "id-asc") {
    filteredList.sort((a, b) => a.id - b.id);
  } else if (sortFilter === "id-desc") {
    filteredList.sort((a, b) => b.id - a.id);
  } else if (sortFilter === "name-asc") {
    if (currentLang === "ko") {
      filteredList.sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));
    } else {
      filteredList.sort((a, b) => a.en.localeCompare(b.en, 'en'));
    }
  } else if (sortFilter === "name-desc") {
    if (currentLang === "ko") {
      filteredList.sort((a, b) => b.ko.localeCompare(a.ko, 'ko'));
    } else {
      filteredList.sort((a, b) => b.en.localeCompare(a.en, 'en'));
    }
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
    card.className = "pokemon-card";
    card.setAttribute("data-id", pokemon.id);

    const paddedId = pokemon.id.toString().padStart(4, "0");
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;

    // Type Badge Elements with language lookup
    const badgesHtml = pokemon.types.map(type => {
      const typeInfo = TYPE_DETAILS[type] || { ko: type, en: type, icon: "ph ph-sparkles" };
      const translatedTypeName = typeInfo[currentLang];
      return `<span class="type-badge type-${type}"><i class="${typeInfo.icon}"></i> ${translatedTypeName}</span>`;
    }).join("");

    // Use name based on language
    const currentName = pokemon[currentLang];

    card.innerHTML = `
      <span class="card-id">#${paddedId}</span>
      <div class="card-img-wrapper">
        <div class="card-img-bg"></div>
        <img src="${imageUrl}" alt="${currentName}" class="card-img" loading="lazy">
      </div>
      <h3 class="card-name">${currentName}</h3>
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
      
      // Short delay for loading state rendering
      setTimeout(() => {
        loadedCount += itemsPerPage;
        renderGrid(true);
        loader.classList.add("hidden");
      }, 250);
    }
  });
}

// ==========================================================================
// Immersive Details Modal (Binance Style)
// ==========================================================================
function setupModalListeners() {
  modalCloseBtn.addEventListener("click", closeDetailModal);
  
  // Click overlay to close
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDetailModal();
  });

  // Prev/Next Nav buttons inside modal (Next support added for premium detail paging)
  modalPrevBtn.addEventListener("click", () => {
    const currentIndex = filteredList.findIndex(p => p.id === activePokemonId);
    if (currentIndex > 0) {
      openDetailModal(filteredList[currentIndex - 1].id);
    }
  });

  // Play Cry Audio
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
  const currentName = pokemonInfo ? pokemonInfo[currentLang] : `Pokémon #${paddedId}`;
  
  modalPokemonId.textContent = `#${paddedId}`;
  modalPokemonName.textContent = currentName;
  
  const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  modalPokemonImg.src = imageUrl;
  
  // Loading animations for detailed values
  modalPokemonTypes.innerHTML = '<span class="skeleton-element skeleton-types"></span>';
  modalPokemonDesc.textContent = currentLang === "ko" ? "도감 설명을 불러오는 중입니다..." : "Loading Pokémon descriptions...";
  modalPokemonHeight.textContent = "-- m";
  modalPokemonWeight.textContent = "-- kg";
  modalPokemonAbilities.textContent = currentLang === "ko" ? "불러오는 중..." : "Loading...";
  modalStatsList.innerHTML = '<div class="loader-container"><div class="pokeball-spinner"></div></div>';
  modalEvolutionChain.innerHTML = '<div class="loader-container"><div class="pokeball-spinner"></div></div>';

  try {
    const data = await fetchPokemonDetails(id);
    // Safety check: ensure modal was not closed or changed while fetching
    if (activePokemonId === id) {
      renderModalDetails(data);
    }
  } catch (err) {
    console.error("Error loading modal details:", err);
    modalPokemonDesc.textContent = currentLang === "ko" 
      ? "상세 정보를 가져오는 중 에러가 발생했습니다." 
      : "Error occurred loading details.";
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

  // Types Badges (Localised translation)
  const badgesHtml = pokemon.types.map(t => {
    const typeInfo = TYPE_DETAILS[t.type.name] || { ko: t.type.name, en: t.type.name, icon: "ph ph-sparkles" };
    return `<span class="type-badge type-${t.type.name}"><i class="${typeInfo.icon}"></i> ${typeInfo[currentLang]}</span>`;
  }).join("");
  modalPokemonTypes.innerHTML = badgesHtml;

  // Height & Weight translation
  modalPokemonHeight.textContent = `${(pokemon.height / 10).toFixed(1)} m`;
  modalPokemonWeight.textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;

  // Abilities (Clean and format)
  const abilitiesStr = pokemon.abilities
    .map(a => a.ability.name.replace("-", " ").toUpperCase())
    .join(" / ");
  modalPokemonAbilities.textContent = abilitiesStr;

  // Description / Flavor Text based on language selection
  const flavorText = species.flavor_text_entries.find(entry => entry.language.name === currentLang);
  const cleanDesc = flavorText 
    ? flavorText.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ").replace(/\r/g, " ") 
    : (currentLang === "ko" ? "도감 설명이 존재하지 않습니다." : "No description text exists.");
  modalPokemonDesc.textContent = cleanDesc;

  // Audio Play button visibility check
  if (pokemon.cries && pokemon.cries.latest) {
    modalCryBtn.style.display = "flex";
  } else {
    modalCryBtn.style.display = "none";
  }

  // Base Stats list rendering (with Trading Price-up / Price-down color overrides)
  modalStatsList.innerHTML = "";
  pokemon.stats.forEach(s => {
    const name = STAT_TRANSLATIONS[currentLang][s.stat.name] || s.stat.name.toUpperCase();
    const val = s.base_stat;
    const percentage = Math.min((val / 255) * 100, 100);
    
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `
      <span class="stat-label">${name}</span>
      <span class="stat-value">${val}</span>
      <div class="stat-bar-container">
        <div class="stat-bar" style="width: 0%"></div>
      </div>
    `;
    
    const bar = row.querySelector(".stat-bar");
    // Binance Trading Semantic Color override based on stat value strength
    if (val >= 90) {
      bar.classList.add("stat-high"); // Trading-up green
    } else if (val < 50) {
      bar.classList.add("stat-low");  // Trading-down red
    } else {
      bar.classList.add("stat-mid");  // Brand Yellow
    }
    
    modalStatsList.appendChild(row);

    // Staggered animate width loading
    setTimeout(() => {
      if (bar) bar.style.width = `${percentage}%`;
    }, 80);
  });

  // Evolution chain rendering
  renderEvolutionChain(evolution);
}

// Render the graphical evolution flow
function renderEvolutionChain(evolutionData) {
  modalEvolutionChain.innerHTML = "";
  const trans = TRANSLATIONS[currentLang];
  
  if (!evolutionData || !evolutionData.chain) {
    modalEvolutionChain.textContent = currentLang === "ko" ? "진화 정보가 존재하지 않습니다." : "No evolution chain found.";
    return;
  }

  const flowContainer = document.createElement("div");
  flowContainer.className = "evolution-chain-flow";
  
  const stages = [];
  let currentLink = evolutionData.chain;

  // Recursive parser to collect nodes
  function traverseChain(link) {
    if (!link) return;
    
    const urlParts = link.species.url.split('/');
    const id = parseInt(urlParts[urlParts.length - 2]);
    
    // Find preloaded names and types
    const preInfo = pokemonList.find(p => p.id === id);
    const name = preInfo ? preInfo[currentLang] : link.species.name;
    const types = preInfo ? preInfo.types : ["normal"];

    // Find trigger details
    let trigger = "";
    if (link.evolution_details && link.evolution_details.length > 0) {
      const details = link.evolution_details[0];
      if (details.min_level) {
        trigger = `${trans.evoTrigger.level}${details.min_level}`;
      } else if (details.item) {
        const itemName = details.item.name.replace("-", " ").toUpperCase();
        trigger = itemName;
      } else if (details.min_happiness) {
        trigger = trans.evoTrigger.happiness;
      } else if (details.time_of_day) {
        const timeStr = details.time_of_day === "day" ? trans.evoTrigger.timeDay : trans.evoTrigger.timeNight;
        trigger = timeStr;
      } else if (details.location) {
        trigger = trans.evoTrigger.location;
      } else if (details.known_move) {
        trigger = trans.evoTrigger.move;
      } else {
        trigger = trans.evoTrigger.evolve;
      }
    }

    stages.push({ id, name, types, trigger });

    // Handle branching evolution lines
    if (link.evolves_to && link.evolves_to.length > 0) {
      if (link.evolves_to.length > 1) {
        const branches = link.evolves_to.map(child => {
          const childUrlParts = child.species.url.split('/');
          const childId = parseInt(childUrlParts[childUrlParts.length - 2]);
          const childPre = pokemonList.find(p => p.id === childId);
          
          let childTrigger = trans.evoTrigger.evolve;
          if (child.evolution_details && child.evolution_details.length > 0) {
            const details = child.evolution_details[0];
            if (details.min_level) childTrigger = `${trans.evoTrigger.level}${details.min_level}`;
            else if (details.item) childTrigger = details.item.name.replace("-", " ").toUpperCase();
          }
          return {
            id: childId,
            name: childPre ? childPre[currentLang] : child.species.name,
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
    if (stage.isBranch) {
      const branchWrapper = document.createElement("div");
      branchWrapper.style.display = "flex";
      branchWrapper.style.flexDirection = "column";
      branchWrapper.style.gap = "8px";

      stage.branches.forEach(branch => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "8px";

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
      if (idx > 0) {
        const arrow = document.createElement("div");
        arrow.className = "evo-arrow";
        arrow.innerHTML = `<i class="ph ph-arrow-right"></i><span class="evo-trigger">${stage.trigger || trans.evoTrigger.evolve}</span>`;
        flowContainer.appendChild(arrow);
      }
      const node = createEvoNode(stage);
      flowContainer.appendChild(node);
    }
  });

  modalEvolutionChain.appendChild(flowContainer);
}

// Create click-navigable evolution card nodes
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
  currentAudio.volume = 0.45;

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
