/**
 * PalateGap Frontend API Manager & State
 */

const API_BASE_URL = "";

// DOM Elements
const locationInput = document.getElementById("locationInput");
const searchBtn = document.getElementById("searchBtn");
const optionsPanel = document.getElementById("optionsPanel");
const locationOptionsList = document.getElementById("locationOptionsList");
const analyzeBtn = document.getElementById("analyzeBtn");
const ideaChoice = document.getElementById("ideaChoice");
const hasIdeaBtn = document.getElementById("hasIdeaBtn");
const ideaForm = document.getElementById("ideaForm");
const ideaDescription = document.getElementById("ideaDescription");
const critiqueBtn = document.getElementById("critiqueBtn");
const errorMessage = document.getElementById("errorMessage");

const loadingState = document.getElementById("loadingState");
const resultsSection = document.getElementById("resultsSection");
const critiqueSection = document.getElementById("critiqueSection");
const debugWrapper = document.getElementById("debugWrapper");

// Idea critique DOM Elements
const critiqueScore = document.getElementById("critiqueScore");
const critiqueVerdict = document.getElementById("critiqueVerdict");
const critiqueSummary = document.getElementById("critiqueSummary");
const critiqueAnalysis = document.getElementById("critiqueAnalysis");
const critiqueTasteAlignment = document.getElementById("critiqueTasteAlignment");
const critiqueMatchedTags = document.getElementById("critiqueMatchedTags");
const critiqueConflictingTags = document.getElementById("critiqueConflictingTags");
const critiqueStrengths = document.getElementById("critiqueStrengths");
const critiqueRisks = document.getElementById("critiqueRisks");
const critiqueSaturation = document.getElementById("critiqueSaturation");
const critiqueCompetitors = document.getElementById("critiqueCompetitors");
const pivotSection = document.getElementById("pivotSection");
const critiquePivot = document.getElementById("critiquePivot");

const conceptsGrid = document.getElementById("conceptsGrid");
const competitorsList = document.getElementById("competitorsList");
const feasibilityAnalysisText = document.getElementById("feasibilityAnalysisText");
const winningConceptName = document.getElementById("winningConceptName");
const recommendationRationale = document.getElementById("recommendationRationale");

// Debug / Call Logic DOM Elements
const toggleLogicBtn = document.getElementById("toggleLogicBtn");
const toggleText = document.getElementById("toggleText");
const logicDebugSection = document.getElementById("logicDebugSection");

const debugArtists = document.getElementById("debugArtists");
const debugBooks = document.getElementById("debugBooks");
const debugMovies = document.getElementById("debugMovies");
const debugTvShows = document.getElementById("debugTvShows");
const debugBrands = document.getElementById("debugBrands");
const debugTags = document.getElementById("debugTags");

// App State
let selectedLocation = null;

// Event Listeners
searchBtn.addEventListener("click", handleSearchLocation);
analyzeBtn.addEventListener("click", handleAnalyzeMarket);
hasIdeaBtn.addEventListener("click", showIdeaForm);
critiqueBtn.addEventListener("click", handleCritiqueIdea);
toggleLogicBtn.addEventListener("click", toggleLogicSection);
locationInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearchLocation();
});

/**
 * Toggle Debug / Call Logic Container
 */
function toggleLogicSection() {
    const isHidden = logicDebugSection.classList.contains("hidden");
    if (isHidden) {
        logicDebugSection.classList.remove("hidden");
        toggleText.textContent = "Hide Call Logic & Metadata";
    } else {
        logicDebugSection.classList.add("hidden");
        toggleText.textContent = "Show Call Logic & Metadata";
    }
}

/**
 * Step 1: Search and fetch 5 location options
 */
async function handleSearchLocation() {
    const query = locationInput.value.trim();
    if (!query) return;

    resetUI();
    showError(null);
    searchBtn.disabled = true;
    searchBtn.textContent = "Searching...";

    try {
        const response = await fetch(`${API_BASE_URL}/location?location=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.result === "success" && data.entities.length > 0) {
            renderLocationOptions(data.entities);
        } else if (data.result === "error") {
            showError(data.error || "Failed to find location.");
        } else {
            showError("No locations found matching your search. Please try another query.");
        }
    } catch (err) {
        showError("Unable to reach backend service. Please verify server is running.");
        console.error(err);
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Find Location";
    }
}

/**
 * Render the top options returned by the /location endpoint
 */
function renderLocationOptions(entities) {
    locationOptionsList.innerHTML = "";
    selectedLocation = null;
    ideaChoice.classList.add("hidden");
    ideaForm.classList.add("hidden");

    entities.forEach((entity) => {
        const item = document.createElement("div");
        item.className = "location-option-item";
        item.innerHTML = `
            <div>
                <div class="location-name">${escapeHtml(entity.disambiguation)}</div>
                <div class="location-id">ID: ${escapeHtml(entity.entity_id)}</div>
            </div>
        `;

        item.addEventListener("click", () => {
            document.querySelectorAll(".location-option-item").forEach(el => el.classList.remove("selected"));
            item.classList.add("selected");
            selectedLocation = entity;
            ideaChoice.classList.remove("hidden");
        });

        locationOptionsList.appendChild(item);
    });

    optionsPanel.classList.remove("hidden");
}

/**
 * Step 2: Trigger /analyze endpoint with selected location metadata
 */
async function handleAnalyzeMarket() {
    if (!selectedLocation) return;

    optionsPanel.classList.add("hidden");
    loadingState.classList.remove("hidden");
    resultsSection.classList.add("hidden");
    critiqueSection.classList.add("hidden");
    debugWrapper.classList.add("hidden");
    showError(null);

    const params = new URLSearchParams({
        location_id: selectedLocation.entity_id,
        location_disambiguation: selectedLocation.disambiguation
    });

    try {
        const response = await fetch(`${API_BASE_URL}/analyze?${params.toString()}`);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(extractErrorDetail(errData) || "Analysis request failed.");
        }

        const data = await response.json();
        renderResults(data);

    } catch (err) {
        showError(err.message || "An unexpected error occurred while analyzing.");
        optionsPanel.classList.remove("hidden");
        console.error(err);
    } finally {
        loadingState.classList.add("hidden");
    }
}

/**
 * Render the returned Analysis JSON payload into structured sections
 */
function renderResults(data) {
    // 1. Render Concepts
    conceptsGrid.innerHTML = "";
    if (data.concepts) {
        data.concepts.forEach(concept => {
            const card = document.createElement("div");
            card.className = "concept-card";
            card.innerHTML = `
                <div>
                    <h3 class="concept-title">${escapeHtml(concept.name)}</h3>
                    <div class="concept-tagline">"${escapeHtml(concept.tagline)}"</div>
                    <div class="concept-detail">
                        <strong>Menu Highlights</strong>
                        <p>${escapeHtml(concept.menu_direction)}</p>
                    </div>
                    <div class="concept-detail">
                        <strong>Atmosphere & Vibe</strong>
                        <p>${escapeHtml(concept.vibe)}</p>
                    </div>
                </div>
                <div class="concept-detail" style="margin-top: 1rem;">
                    <strong>Target Demographic</strong>
                    <p>${escapeHtml(concept.target_audience)}</p>
                </div>
            `;
            conceptsGrid.appendChild(card);
        });
    }

    // 2. Render Competitors
    competitorsList.innerHTML = "";
    if (data.competitors_found) {
        data.competitors_found.forEach(comp => {
            const card = document.createElement("div");
            card.className = "competitor-card";
            card.innerHTML = `
                <div class="competitor-name">${escapeHtml(comp.name)}</div>
                <div class="competitor-style">${escapeHtml(comp.style)}</div>
                <div class="competitor-notes">${escapeHtml(comp.notes)}</div>
            `;
            competitorsList.appendChild(card);
        });
    }

    // 3. Render Feasibility Analysis
    feasibilityAnalysisText.textContent = data.feasibility_analysis || "No analysis provided.";

    // 4. Render Winning Recommendation
    winningConceptName.textContent = data.recommended_concept_name || "Recommended Concept";
    recommendationRationale.textContent = data.recommendation_rationale || "";

    // 5. Render Call Logic Metadata Section
    renderDebug(data);

    // Show results
    resultsSection.classList.remove("hidden");
}

/**
 * Show the idea form when the user has a concept in mind
 */
function showIdeaForm() {
    ideaForm.classList.remove("hidden");
    ideaDescription.focus();
}

/**
 * Step 2 (alternate): Send the user's own concept to the /critique endpoint
 */
async function handleCritiqueIdea() {
    if (!selectedLocation) return;

    const description = ideaDescription.value.trim();
    if (description.length < 10) {
        showError("Please describe your restaurant idea in a sentence or two.");
        ideaDescription.focus();
        return;
    }

    optionsPanel.classList.add("hidden");
    loadingState.classList.remove("hidden");
    resultsSection.classList.add("hidden");
    critiqueSection.classList.add("hidden");
    debugWrapper.classList.add("hidden");
    showError(null);

    try {
        const response = await fetch(`${API_BASE_URL}/critique`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                location_id: selectedLocation.entity_id,
                location_disambiguation: selectedLocation.disambiguation,
                description: description
            })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(extractErrorDetail(errData) || "Critique request failed.");
        }

        const data = await response.json();
        renderCritique(data);

    } catch (err) {
        showError(err.message || "An unexpected error occurred while evaluating your idea.");
        optionsPanel.classList.remove("hidden");
        console.error(err);
    } finally {
        loadingState.classList.add("hidden");
    }
}

/**
 * Render the /critique JSON payload
 */
function renderCritique(data) {
    critiqueScore.textContent = data.feasibility_score ?? "?";
    critiqueVerdict.textContent = data.verdict_label || "Verdict";
    critiqueSummary.textContent = data.summary || "";
    critiqueAnalysis.textContent = data.feasibility_analysis || "No analysis provided.";
    critiqueTasteAlignment.textContent = data.taste_alignment || "";
    critiqueSaturation.textContent = data.market_saturation || "";

    renderTagList(critiqueMatchedTags, data.matched_tags);
    renderTagList(critiqueConflictingTags, data.conflicting_tags);
    renderPointList(critiqueStrengths, data.strengths);
    renderPointList(critiqueRisks, data.risks);

    critiqueCompetitors.innerHTML = "";
    if (data.competitors_found) {
        data.competitors_found.forEach(comp => {
            const card = document.createElement("div");
            card.className = "competitor-card";
            card.innerHTML = `
                <div class="competitor-name">${escapeHtml(comp.name)}</div>
                <div class="competitor-style">${escapeHtml(comp.style)}</div>
                <div class="competitor-notes">${escapeHtml(comp.notes)}</div>
            `;
            critiqueCompetitors.appendChild(card);
        });
    }

    // The pivot only appears when the model found a worthwhile one
    if (data.small_pivot && data.small_pivot.trim()) {
        critiquePivot.textContent = data.small_pivot;
        pivotSection.classList.remove("hidden");
    } else {
        pivotSection.classList.add("hidden");
    }

    renderDebug(data);
    critiqueSection.classList.remove("hidden");
}

/**
 * Shared Call Logic Metadata renderer (used by both flows)
 */
function renderDebug(data) {
    renderBadgeList(debugArtists, data.artists);
    renderBadgeList(debugBooks, data.books);
    renderBadgeList(debugMovies, data.movies);
    renderBadgeList(debugTvShows, data.tv_shows);
    renderBadgeList(debugBrands, data.brands);
    renderTagList(debugTags, data.tags);
    debugWrapper.classList.remove("hidden");
}

/**
 * Helper to render an array of sentences as a list
 */
function renderPointList(container, items) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
        container.innerHTML = `<li class="empty-text">None identified</li>`;
        return;
    }
    items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        container.appendChild(li);
    });
}

/**
 * FastAPI returns detail as a string or, for validation errors, a list
 */
function extractErrorDetail(errData) {
    if (!errData || !errData.detail) return "";
    if (typeof errData.detail === "string") return errData.detail;
    if (Array.isArray(errData.detail)) return errData.detail.map(d => d.msg).join("; ");
    return "";
}

/**
 * Helper to render simple text arrays as badges
 */
function renderBadgeList(container, items) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
        container.innerHTML = `<span class="empty-text">No items returned</span>`;
        return;
    }
    items.forEach(item => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = typeof item === "string" ? item : JSON.stringify(item);
        container.appendChild(badge);
    });
}

/**
 * Helper to render tag key/value pairs
 */
function renderTagList(container, tags) {
    container.innerHTML = "";
    if (!tags || tags.length === 0) {
        container.innerHTML = `<span class="empty-text">No tags returned</span>`;
        return;
    }
    tags.forEach(tag => {
        const badge = document.createElement("span");
        badge.className = "badge badge-accent";
        badge.textContent = Array.isArray(tag) ? `${tag[0]} (${tag[1]})` : tag;
        container.appendChild(badge);
    });
}

/* Helpers */
function resetUI() {
    optionsPanel.classList.add("hidden");
    resultsSection.classList.add("hidden");
    critiqueSection.classList.add("hidden");
    debugWrapper.classList.add("hidden");
    loadingState.classList.add("hidden");
    ideaChoice.classList.add("hidden");
    ideaForm.classList.add("hidden");
    logicDebugSection.classList.add("hidden");
    toggleText.textContent = "Show Call Logic & Metadata";
}

function showError(msg) {
    if (msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove("hidden");
    } else {
        errorMessage.classList.add("hidden");
        errorMessage.textContent = "";
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[m]));
}