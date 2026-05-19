const storageKey = "kindling-journal-entries";
const profilesKey = "kindling-profiles";
const activeProfileKey = "kindling-active-profile";
const missedDismissedKey = "kindling-missed-dismissed-date";
const customLocationsKey = "kindling-custom-locations";
const hiddenLocationsKey = "kindling-hidden-locations";
const customPositiveImpactsKey = "kindling-positive-impacts";
const customNegativeImpactsKey = "kindling-negative-impacts";
const impactSettingsKey = "kindling-impact-settings";
const preferencesKey = "kindling-preferences";

const defaultLocations = ["Head", "Neck", "Shoulders", "Back", "Hips", "Hands", "Legs", "Whole body"];

const prompts = [
  "What would make the next hour kinder?",
  "What is one signal your body gave you today?",
  "What helped even five percent?",
  "What can be smaller tomorrow?",
  "What do you want remembered about today besides pain?",
  "Where did you spend energy that mattered?",
  "What support would be easiest to ask for?"
];

const form = document.querySelector("#entry-form");
const saveEntryButton = form.querySelector(".primary-button");
const dateInput = document.querySelector("#entry-date");
const painInput = document.querySelector("#pain");
const capacityInput = document.querySelector("#capacity");
const painOutput = document.querySelector("#pain-output");
const capacityOutput = document.querySelector("#capacity-output");
const promptText = document.querySelector("#prompt-text");
const entriesList = document.querySelector("#entries-list");
const entryCount = document.querySelector("#entry-count");
const entrySummaryLabel = document.querySelector("#entry-summary-label");
const avgPain = document.querySelector("#avg-pain");
const avgCapacity = document.querySelector("#avg-capacity");
const painBar = document.querySelector("#pain-bar");
const capacityBar = document.querySelector("#capacity-bar");
const patternNote = document.querySelector("#pattern-note");
const trendChart = document.querySelector("#trend-chart");
const connectionSummary = document.querySelector("#connection-summary");
const positiveConnections = document.querySelector("#positive-connections");
const negativeConnections = document.querySelector("#negative-connections");
const heroDescription = document.querySelector("#hero-description");
const brandName = document.querySelector(".brand p");
const brandSubtitle = document.querySelector(".brand span");
const brandMark = document.querySelector(".brand-mark");
const avatarImage = document.querySelector("#avatar-image");
const profileSelect = document.querySelector("#profile-select");
const profileNameInput = document.querySelector("#profile-name");
const newProfileButton = document.querySelector("#new-profile");
const avatarSelect = document.querySelector("#avatar-select");
const editLocationsButton = document.querySelector("#edit-locations");
const focusAreaEditor = document.querySelector("#focus-area-editor");
const customLocationInput = document.querySelector("#custom-location");
const painDetailList = document.querySelector("#pain-detail-list");
const positiveImpactChips = document.querySelector("#positive-impact-chips");
const negativeImpactChips = document.querySelector("#negative-impact-chips");
const customPositiveImpactInput = document.querySelector("#custom-positive-impact");
const customNegativeImpactInput = document.querySelector("#custom-negative-impact");
const drinkSelect = document.querySelector("#drink-select");
const themeSelect = document.querySelector("#theme-select");
const modeSelect = document.querySelector("#mode-select");
const missedPanel = document.querySelector("#missed-panel");
const missedTitle = document.querySelector("#missed-title");
const missedCopy = document.querySelector("#missed-copy");
const missedForm = document.querySelector("#missed-form");
const missedNote = document.querySelector("#missed-note");

const today = new Date();
dateInput.value = today.toISOString().slice(0, 10);
let editingEntryId = null;
let focusAreasEditing = false;

function slugifyProfileName(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kindling";
}

function readProfiles() {
  try {
    const profiles = JSON.parse(localStorage.getItem(profilesKey)) || [];
    return profiles.length ? profiles : [{ id: "default", name: "Kindling", avatar: "cat" }];
  } catch {
    return [{ id: "default", name: "Kindling", avatar: "cat" }];
  }
}

function writeProfiles(profiles) {
  localStorage.setItem(profilesKey, JSON.stringify(profiles));
}

function getActiveProfileId() {
  return localStorage.getItem(activeProfileKey) || readProfiles()[0].id;
}

function setActiveProfileId(profileId) {
  localStorage.setItem(activeProfileKey, profileId);
}

function profileStorageKey(baseKey) {
  return `${baseKey}:${getActiveProfileId()}`;
}

function readEntries() {
  try {
    const scoped = localStorage.getItem(profileStorageKey(storageKey));
    if (scoped) {
      return JSON.parse(scoped) || [];
    }

    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  localStorage.setItem(profileStorageKey(storageKey), JSON.stringify(entries));
}

function readCustomLocations() {
  try {
    return JSON.parse(localStorage.getItem(customLocationsKey)) || [];
  } catch {
    return [];
  }
}

function writeCustomLocations(locations) {
  localStorage.setItem(customLocationsKey, JSON.stringify(locations));
}

function readHiddenLocations() {
  try {
    return JSON.parse(localStorage.getItem(hiddenLocationsKey)) || [];
  } catch {
    return [];
  }
}

function writeHiddenLocations(locations) {
  localStorage.setItem(hiddenLocationsKey, JSON.stringify(locations));
}

function readCustomImpacts(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeCustomImpacts(key, impacts) {
  localStorage.setItem(key, JSON.stringify(impacts));
}

function readImpactSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(impactSettingsKey)) || {};
    return {
      helped: {
        hidden: settings.helped?.hidden || [],
        renames: settings.helped?.renames || {}
      },
      worsened: {
        hidden: settings.worsened?.hidden || [],
        renames: settings.worsened?.renames || {}
      }
    };
  } catch {
    return {
      helped: { hidden: [], renames: {} },
      worsened: { hidden: [], renames: {} }
    };
  }
}

function writeImpactSettings(settings) {
  localStorage.setItem(impactSettingsKey, JSON.stringify(settings));
}

function readPreferences() {
  try {
    return JSON.parse(localStorage.getItem(profileStorageKey(preferencesKey))) || {};
  } catch {
    return {};
  }
}

function writePreferences(preferences) {
  localStorage.setItem(profileStorageKey(preferencesKey), JSON.stringify(preferences));
}

function selectedLocations() {
  return [...document.querySelectorAll("#location-chips input:checked")].map((input) => input.value);
}

function selectedLocationDetails() {
  const details = {};
  document.querySelectorAll("[data-pain-detail]").forEach((input) => {
    if (input.value.trim()) {
      details[input.dataset.painDetail] = input.value.trim();
    }
  });
  return details;
}

function resetLocationChips() {
  document.querySelectorAll("#location-chips input").forEach((input) => {
    input.checked = false;
  });
  renderPainDetailFields();
}

function renderPainDetailFields() {
  const selected = selectedLocations();
  painDetailList.innerHTML = selected.map((location) => `
    <label class="field pain-detail-field">
      <span>Describe ${escapeHtml(location.toLowerCase())} pain</span>
      <input data-pain-detail="${escapeHtml(location)}" type="text" placeholder="Sharp, aching, burning, stiff, radiating">
    </label>
  `).join("");
}

function renderCustomLocations() {
  const locationChips = document.querySelector("#location-chips");
  const selected = new Set(selectedLocations().map((location) => location.toLowerCase()));
  const hidden = new Set(readHiddenLocations().map((location) => location.toLowerCase()));
  const locations = [...defaultLocations, ...readCustomLocations()]
    .filter((location, index, list) => list.findIndex((item) => item.toLowerCase() === location.toLowerCase()) === index)
    .filter((location) => !hidden.has(location.toLowerCase()));

  locationChips.innerHTML = locations.map((location) => `
    <label class="managed-chip">
      <input type="checkbox" value="${escapeHtml(location)}" ${selected.has(location.toLowerCase()) ? "checked" : ""}>
      <span>${escapeHtml(location)}</span>
      ${focusAreasEditing ? `
        <button class="chip-icon-button edit-chip-button" type="button" data-edit-location="${escapeHtml(location)}" aria-label="Rename ${escapeHtml(location)}">Edit</button>
        <button class="chip-icon-button" type="button" data-remove-location="${escapeHtml(location)}" aria-label="Remove ${escapeHtml(location)}">x</button>
      ` : ""}
    </label>
  `).join("");
}

function setFocusAreasEditing(isEditing) {
  focusAreasEditing = isEditing;
  editLocationsButton.textContent = isEditing ? "Done" : "Edit";
  focusAreaEditor.hidden = !isEditing;
  renderCustomLocations();
  renderPainDetailFields();
}

function renderProfiles() {
  const profiles = readProfiles();
  const activeId = getActiveProfileId();
  profileSelect.innerHTML = profiles.map((profile) => `
    <option value="${profile.id}" ${profile.id === activeId ? "selected" : ""}>${escapeHtml(profile.name)}</option>
  `).join("");
}

function saveCurrentProfile() {
  const name = profileNameInput.value.trim() || "Kindling";
  const avatar = avatarSelect.value;
  const profiles = readProfiles();
  const activeId = getActiveProfileId();
  const existingIndex = profiles.findIndex((profile) => profile.id === activeId);
  const baseId = slugifyProfileName(name);
  const id = existingIndex >= 0 ? activeId : baseId;
  const profile = { id, name, avatar };

  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }

  writeProfiles(profiles);
  setActiveProfileId(id);
  updatePreference("profileName", name);
  updatePreference("avatar", avatar);
  renderProfiles();
  renderEntries();
}

function syncActiveProfile() {
  const name = profileNameInput.value.trim() || "Kindling";
  const avatar = avatarSelect.value;
  const profiles = readProfiles();
  const activeId = getActiveProfileId();
  const existingIndex = profiles.findIndex((profile) => profile.id === activeId);

  if (existingIndex >= 0) {
    profiles[existingIndex] = {
      ...profiles[existingIndex],
      name,
      avatar
    };
    writeProfiles(profiles);
    renderProfiles();
  }
}

function createNewProfile() {
  const profiles = readProfiles();
  const baseName = "New profile";
  let nextNumber = profiles.length + 1;
  let name = `${baseName} ${nextNumber}`;

  while (profiles.some((profile) => profile.name.toLowerCase() === name.toLowerCase())) {
    nextNumber += 1;
    name = `${baseName} ${nextNumber}`;
  }

  const baseId = slugifyProfileName(name);
  let id = baseId;
  let suffix = 2;
  while (profiles.some((profile) => profile.id === id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  profiles.push({
    id,
    name,
    avatar: avatarSelect.value || "cat"
  });
  writeProfiles(profiles);
  setActiveProfileId(id);
  writePreferences({
    ...readPreferences(),
    profileName: name,
    avatar: avatarSelect.value || "cat",
    drink: drinkSelect.value || "tea",
    theme: themeSelect.value || "meadow",
    mode: modeSelect.value || "light"
  });
  renderProfiles();
  applyPreferences();
  renderEntries();
}

function switchProfile(profileId) {
  setActiveProfileId(profileId);
  const profile = readProfiles().find((item) => item.id === profileId);
  if (profile) {
    const preferences = {
      ...readPreferences(),
      profileName: profile.name,
      avatar: profile.avatar
    };
    writePreferences(preferences);
  }
  applyPreferences();
  renderProfiles();
  renderEntries();
}

function addCustomLocation() {
  const location = customLocationInput.value.trim();
  if (!location) {
    return;
  }

  const builtInLocations = [...document.querySelectorAll("#location-chips input")].map((input) => input.value.toLowerCase());
  const customLocations = readCustomLocations();
  const alreadyExists = [...builtInLocations, ...customLocations.map((item) => item.toLowerCase())]
    .includes(location.toLowerCase());

  if (!alreadyExists) {
    customLocations.push(location);
    writeCustomLocations(customLocations);
  }

  writeHiddenLocations(readHiddenLocations().filter((item) => item.toLowerCase() !== location.toLowerCase()));

  customLocationInput.value = "";
  renderCustomLocations();

  const added = [...document.querySelectorAll("#location-chips input")]
    .find((input) => input.value.toLowerCase() === location.toLowerCase());
  if (added) {
    added.checked = true;
  }
  renderPainDetailFields();
}

function removeLocationSection(location) {
  const hiddenLocations = readHiddenLocations();
  if (!hiddenLocations.some((item) => item.toLowerCase() === location.toLowerCase())) {
    hiddenLocations.push(location);
  }
  writeHiddenLocations(hiddenLocations);
  renderCustomLocations();
  renderPainDetailFields();
}

function renameLocationSection(location) {
  const nextName = window.prompt("Rename this focus area", location);
  if (nextName === null) {
    return;
  }

  const trimmed = nextName.trim();
  if (!trimmed || trimmed.toLowerCase() === location.toLowerCase()) {
    return;
  }

  const customLocations = readCustomLocations();
  const defaultLower = new Set(defaultLocations.map((item) => item.toLowerCase()));
  const renamedCustomLocations = customLocations
    .filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
    .map((item) => item.toLowerCase() === location.toLowerCase() ? trimmed : item);

  if (!renamedCustomLocations.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
    renamedCustomLocations.push(trimmed);
  }

  writeCustomLocations(renamedCustomLocations);
  if (defaultLower.has(location.toLowerCase())) {
    removeLocationSection(location);
  } else {
    writeHiddenLocations(readHiddenLocations().filter((item) => item.toLowerCase() !== trimmed.toLowerCase()));
    renderCustomLocations();
    renderPainDetailFields();
  }
}

function ensureLocationsAvailable(locations) {
  const customLocations = readCustomLocations();
  const customLower = new Set(customLocations.map((location) => location.toLowerCase()));
  const defaultLower = new Set(defaultLocations.map((location) => location.toLowerCase()));
  locations.forEach((location) => {
    if (!defaultLower.has(location.toLowerCase()) && !customLower.has(location.toLowerCase())) {
      customLocations.push(location);
      customLower.add(location.toLowerCase());
    }
  });
  writeCustomLocations(customLocations);
  writeHiddenLocations(readHiddenLocations().filter((location) => (
    !locations.some((selected) => selected.toLowerCase() === location.toLowerCase())
  )));
  renderCustomLocations();
}

function renderImpactOptions() {
  renderImpactChipSet(
    positiveImpactChips,
    [...impactSuggestionsFromEntries("helped"), ...readCustomImpacts(customPositiveImpactsKey)],
    "helped",
    "Positive suggestions will appear from past entries."
  );
  renderImpactChipSet(
    negativeImpactChips,
    [...impactSuggestionsFromEntries("worsened"), ...readCustomImpacts(customNegativeImpactsKey)],
    "worsened",
    "Negative suggestions will appear from past entries."
  );
}

function impactSuggestionsFromEntries(key) {
  const counts = new Map();
  readEntries()
    .filter((entry) => entry.type !== "missed")
    .forEach((entry) => {
      splitTags(entry[key]).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
    .slice(0, 8);
}

function renderImpactChipSet(container, impacts, targetInputId, emptyText) {
  const settings = readImpactSettings();
  const targetSettings = settings[targetInputId] || { hidden: [], renames: {} };
  const hidden = new Set(targetSettings.hidden.map((impact) => impact.toLowerCase()));
  const uniqueImpacts = [...new Set(impacts.map((impact) => impact.trim()).filter(Boolean))]
    .filter((impact) => !hidden.has(impact.toLowerCase()));
  if (!uniqueImpacts.length) {
    container.innerHTML = `<p class="quiet-note impact-empty">${emptyText}</p>`;
    return;
  }

  container.innerHTML = uniqueImpacts.map((impact) => {
    const label = targetSettings.renames[impact] || impact;
    return `
    <span class="impact-chip managed-impact">
      <button class="impact-main" type="button" data-impact="${escapeHtml(label)}" data-impact-original="${escapeHtml(impact)}" data-target-input="${targetInputId}">
        ${escapeHtml(label)}
      </button>
      <button class="chip-icon-button" type="button" data-impact-action="edit" data-impact-original="${escapeHtml(impact)}" data-target-input="${targetInputId}" aria-label="Edit ${escapeHtml(label)}">Edit</button>
      <button class="chip-icon-button" type="button" data-impact-action="remove" data-impact-original="${escapeHtml(impact)}" data-target-input="${targetInputId}" aria-label="Remove ${escapeHtml(label)}">x</button>
    </span>
  `;
  }).join("");
}

function removeImpactSuggestion(targetInputId, originalImpact) {
  const settings = readImpactSettings();
  const targetSettings = settings[targetInputId] || { hidden: [], renames: {} };
  if (!targetSettings.hidden.some((impact) => impact.toLowerCase() === originalImpact.toLowerCase())) {
    targetSettings.hidden.push(originalImpact);
  }
  delete targetSettings.renames[originalImpact];
  settings[targetInputId] = targetSettings;
  writeImpactSettings(settings);
  renderImpactOptions();
}

function editImpactSuggestion(targetInputId, originalImpact) {
  const settings = readImpactSettings();
  const targetSettings = settings[targetInputId] || { hidden: [], renames: {} };
  const currentLabel = targetSettings.renames[originalImpact] || originalImpact;
  const nextLabel = window.prompt("Edit this suggestion", currentLabel);
  if (nextLabel === null) {
    return;
  }

  const trimmed = nextLabel.trim();
  if (!trimmed) {
    removeImpactSuggestion(targetInputId, originalImpact);
    return;
  }

  targetSettings.renames[originalImpact] = trimmed;
  settings[targetInputId] = targetSettings;
  writeImpactSettings(settings);
  renderImpactOptions();
}

function addCustomImpact(input, storageKey, targetInputId) {
  const impact = input.value.trim();
  if (!impact) {
    return;
  }

  const impacts = readCustomImpacts(storageKey);
  if (!impacts.some((item) => item.toLowerCase() === impact.toLowerCase())) {
    impacts.push(impact);
    writeCustomImpacts(storageKey, impacts);
  }

  const settings = readImpactSettings();
  const targetSettings = settings[targetInputId] || { hidden: [], renames: {} };
  targetSettings.hidden = targetSettings.hidden.filter((item) => item.toLowerCase() !== impact.toLowerCase());
  settings[targetInputId] = targetSettings;
  writeImpactSettings(settings);

  input.value = "";
  renderImpactOptions();
  appendImpactToInput(document.querySelector(`#${targetInputId}`), impact);
}

function addImpactsFromEntryInput(targetInputId, storageKey) {
  const input = document.querySelector(`#${targetInputId}`);
  const impacts = splitTags(input.value);
  if (!impacts.length) {
    input.focus();
    return;
  }

  const customImpacts = readCustomImpacts(storageKey);
  const customLower = new Set(customImpacts.map((impact) => impact.toLowerCase()));
  impacts.forEach((impact) => {
    if (!customLower.has(impact.toLowerCase())) {
      customImpacts.push(impact);
      customLower.add(impact.toLowerCase());
    }
  });
  writeCustomImpacts(storageKey, customImpacts);

  const settings = readImpactSettings();
  const targetSettings = settings[targetInputId] || { hidden: [], renames: {} };
  targetSettings.hidden = targetSettings.hidden.filter((item) => !impacts.includes(item.toLowerCase()));
  settings[targetInputId] = targetSettings;
  writeImpactSettings(settings);
  renderImpactOptions();
}

function appendImpactToInput(input, impact) {
  const current = splitTags(input.value);
  if (!current.includes(impact.toLowerCase())) {
    current.push(impact);
  }
  input.value = current.join(", ");
}

function loadEntryForEditing(entryId) {
  const entry = readEntries().find((item) => item.id === entryId);
  if (!entry || entry.type === "missed") {
    return;
  }

  editingEntryId = entryId;
  ensureLocationsAvailable(entry.locations || []);
  dateInput.value = entry.date;
  painInput.value = entry.pain;
  capacityInput.value = entry.capacity;
  document.querySelector("#context").value = entry.context || "";
  document.querySelector("#helped").value = entry.helped || "";
  document.querySelector("#worsened").value = entry.worsened || "";
  document.querySelector("#note").value = entry.note || "";

  document.querySelectorAll("#location-chips input").forEach((input) => {
    input.checked = (entry.locations || []).some((location) => location.toLowerCase() === input.value.toLowerCase());
  });
  renderPainDetailFields();
  Object.entries(entry.locationDetails || {}).forEach(([location, detail]) => {
    const input = document.querySelector(`[data-pain-detail="${CSS.escape(location)}"]`);
    if (input) {
      input.value = detail;
    }
  });

  updateRanges();
  saveEntryButton.textContent = "Update Entry";
  window.location.hash = "today";
  requestAnimationFrame(() => form.scrollIntoView({ behavior: "smooth", block: "start" }));
}

function resetEditingState() {
  editingEntryId = null;
  saveEntryButton.textContent = "Save Entry";
}

function avatarSvgDataUrl(avatar) {
  const colors = {
    cat: ["#efc76e", "#75627d", "#fff7dd"],
    rabbit: ["#f1d9df", "#75627d", "#fff7fb"],
    fox: ["#e99a86", "#75627d", "#fff0df"],
    frog: ["#91aa91", "#55715d", "#f2ffe8"],
    bear: ["#ad9a78", "#75627d", "#fff1df"]
  }[avatar] || ["#efc76e", "#75627d", "#fff7dd"];
  const [main, line, light] = colors;
  if (avatar === "frog") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fffdf8"/><stop offset="1" stop-color="#e8f8df"/></linearGradient><linearGradient id="face" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#b8d88b"/><stop offset="1" stop-color="#79a879"/></linearGradient></defs><rect width="32" height="32" rx="11" fill="url(#bg)"/><circle cx="10.5" cy="10" r="5.1" fill="#91aa91"/><circle cx="21.5" cy="10" r="5.1" fill="#91aa91"/><ellipse cx="16" cy="18" rx="11.3" ry="9.2" fill="url(#face)"/><circle cx="10.5" cy="10" r="2.8" fill="#f7fff2"/><circle cx="21.5" cy="10" r="2.8" fill="#f7fff2"/><circle cx="10.5" cy="10.2" r="1.25" fill="#55715d"/><circle cx="21.5" cy="10.2" r="1.25" fill="#55715d"/><circle cx="11.2" cy="20.1" r="1.15" fill="#e99a86" opacity="0.45"/><circle cx="20.8" cy="20.1" r="1.15" fill="#e99a86" opacity="0.45"/><path d="M11.5 19.2c1.4 2.2 7.6 2.2 9 0" fill="none" stroke="#55715d" stroke-width="1.35" stroke-linecap="round"/><path d="M8.2 16.1c1.5-.8 3-.8 4.3 0M19.5 16.1c1.3-.8 2.8-.8 4.3 0" fill="none" stroke="#55715d" stroke-width="1" stroke-linecap="round" opacity="0.45"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  const ear = {
    rabbit: `<ellipse cx="10.8" cy="8.4" rx="3.2" ry="6.1" fill="${main}" transform="rotate(-8 10.8 8.4)"/><ellipse cx="21.2" cy="8.4" rx="3.2" ry="6.1" fill="${main}" transform="rotate(8 21.2 8.4)"/><ellipse cx="10.8" cy="9" rx="1.15" ry="3.8" fill="${light}" opacity="0.9" transform="rotate(-8 10.8 9)"/><ellipse cx="21.2" cy="9" rx="1.15" ry="3.8" fill="${light}" opacity="0.9" transform="rotate(8 21.2 9)"/>`,
    bear: `<circle cx="9.4" cy="11" r="4" fill="${main}"/><circle cx="22.6" cy="11" r="4" fill="${main}"/><circle cx="9.4" cy="11" r="1.9" fill="${light}" opacity="0.82"/><circle cx="22.6" cy="11" r="1.9" fill="${light}" opacity="0.82"/>`,
    cat: `<path d="M8.7 13.3 11.2 6.4l4.2 5.3M23.3 13.3l-2.5-6.9-4.2 5.3" fill="${main}" stroke="${line}" stroke-width="0.9" stroke-linejoin="round"/>`,
    fox: `<path d="M8 13.8 10.7 5.9l5.1 6.2M24 13.8l-2.7-7.9-5.1 6.2" fill="${main}" stroke="${line}" stroke-width="0.9" stroke-linejoin="round"/>`
  }[avatar];
  const faceShape = avatar === "fox"
    ? `<path d="M6 16.4c.5-7.1 19.5-7.1 20 0 .35 5.1-4.65 9.9-10 9.9S5.65 21.5 6 16.4Z" fill="${main}"/>`
    : `<ellipse cx="16" cy="17.5" rx="10.7" ry="9.1" fill="${main}"/>`;
  const muzzle = avatar === "fox"
    ? `<path d="M9.6 20.2c1.6 3.3 11.2 3.3 12.8 0-1.65-1.35-3.9-2.05-6.4-2.05s-4.75.7-6.4 2.05Z" fill="${light}" opacity="0.96"/>`
    : `<ellipse cx="16" cy="20.4" rx="5.4" ry="3.25" fill="${light}" opacity="0.86"/>`;
  const whiskers = ["cat", "fox"].includes(avatar)
    ? `<path d="M7.2 20.1h4.2M20.6 20.1h4.2M7.7 22.2l3.7-.8M20.6 21.4l3.7.8" fill="none" stroke="${line}" stroke-width="0.75" stroke-linecap="round" opacity="0.45"/>`
    : "";
  const eyeExtra = avatar === "rabbit" ? `<circle cx="12" cy="15.9" r="0.45" fill="#fff"/><circle cx="19" cy="15.9" r="0.45" fill="#fff"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fffdf8"/><stop offset="1" stop-color="${light}"/></linearGradient><linearGradient id="soft" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".24"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="32" height="32" rx="11" fill="url(#bg)"/><g>${ear}${faceShape}<ellipse cx="16" cy="14.7" rx="7.3" ry="3.2" fill="url(#soft)"/>${muzzle}<circle cx="11.5" cy="20" r="1.05" fill="#e99a86" opacity="0.34"/><circle cx="20.5" cy="20" r="1.05" fill="#e99a86" opacity="0.34"/><circle cx="12.3" cy="16.25" r="1.15" fill="${line}"/><circle cx="19.7" cy="16.25" r="1.15" fill="${line}"/>${eyeExtra}<circle cx="16" cy="18.75" r="0.8" fill="${line}"/><path d="M12.5 20.25c1.35 2 5.65 2 7 0" fill="none" stroke="${line}" stroke-width="1.1" stroke-linecap="round"/>${whiskers}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

function updateRanges() {
  painOutput.value = painInput.value;
  capacityOutput.value = capacityInput.value;
}

function renderEntries() {
  const entries = readEntries().sort((a, b) => b.createdAt - a.createdAt);
  entryCount.textContent = `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;
  renderImpactOptions();
  updateEntrySummary(entries);
  renderMissedPanel(entries);

  if (!entries.length) {
    entriesList.innerHTML = '<div class="empty-state">No entries yet. Start with one tiny note.</div>';
    renderPatterns(entries);
    return;
  }

  entriesList.innerHTML = entries.map((entry) => {
    const locations = entry.locations.length
      ? `<div class="tag-row">${entry.locations.map((location) => `<span class="tag">${escapeHtml(location)}</span>`).join("")}</div>`
      : "";

    const locationDetails = entry.locationDetails && Object.keys(entry.locationDetails).length
      ? `<div class="entry-detail-grid">${Object.entries(entry.locationDetails).map(([location, detail]) => `<span>${escapeHtml(location)}: ${escapeHtml(detail)}</span>`).join("")}</div>`
      : "";

    const context = entry.context
      ? `<span>Context: ${escapeHtml(entry.context)}</span>`
      : "";

    const helped = entry.helped
      ? `<span>Positive: ${escapeHtml(entry.helped)}</span>`
      : "";

    const worsened = entry.worsened
      ? `<span>Negative: ${escapeHtml(entry.worsened)}</span>`
      : "";

    return `
      <article class="entry-item ${entry.type === "missed" ? "missed-entry" : ""}">
        <div class="entry-topline">
          <strong>${formatDate(entry.date)}</strong>
          <div class="entry-stats">
            ${entry.type === "missed"
              ? `<span>Welcome-back check-in</span>`
              : `<span>Pain ${entry.pain}/10</span><span>Energy ${entry.capacity}/10</span>`}
          </div>
        </div>
        ${locations}
        ${locationDetails}
        <div class="entry-stats">${context}${helped}${worsened}</div>
        <p class="entry-note">${escapeHtml(entry.note || "A quiet check-in, saved without extra words.")}</p>
        ${entry.type === "missed" ? "" : `<button class="mini-button edit-entry-button" type="button" data-edit-entry="${entry.id}">Edit entry</button>`}
      </article>
    `;
  }).join("");

  renderPatterns(entries);
  renderConnections(entries);
}

function renderPatterns(entries) {
  const recent = entries.filter((entry) => entry.type !== "missed").slice(0, 7);
  if (!recent.length) {
    avgPain.textContent = "-";
    avgCapacity.textContent = "-";
    painBar.style.width = "0%";
    capacityBar.style.width = "0%";
    patternNote.textContent = "Add an entry to start seeing gentle patterns.";
    renderTrendChart([]);
    renderConnections(entries);
    return;
  }

  const painAverage = average(recent.map((entry) => Number(entry.pain)));
  const capacityAverage = average(recent.map((entry) => Number(entry.capacity)));
  avgPain.textContent = painAverage.toFixed(1);
  avgCapacity.textContent = capacityAverage.toFixed(1);
  painBar.style.width = `${painAverage * 10}%`;
  capacityBar.style.width = `${capacityAverage * 10}%`;
  patternNote.textContent = makePatternNote(painAverage, capacityAverage);
  renderTrendChart(entries);
}

function renderTrendChart(entries) {
  if (!trendChart) {
    return;
  }

  const chartEntries = entries
    .filter((entry) => entry.type !== "missed" && Number.isFinite(Number(entry.pain)) && Number.isFinite(Number(entry.capacity)))
    .sort((a, b) => {
      const dateA = new Date(`${a.date || ""}T12:00:00`).getTime() || a.createdAt || 0;
      const dateB = new Date(`${b.date || ""}T12:00:00`).getTime() || b.createdAt || 0;
      return dateA - dateB;
    })
    .slice(-14);

  if (chartEntries.length < 2) {
    trendChart.innerHTML = '<div class="empty-trend">Add two entries to draw your trend.</div>';
    return;
  }

  const width = 860;
  const height = 320;
  const padding = { top: 28, right: 44, bottom: 54, left: 44 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xFor = (index) => padding.left + (chartEntries.length === 1 ? innerWidth / 2 : (index / (chartEntries.length - 1)) * innerWidth);
  const yFor = (value) => padding.top + innerHeight - (Math.max(0, Math.min(10, Number(value))) / 10) * innerHeight;
  const painPoints = chartEntries.map((entry, index) => `${xFor(index)},${yFor(entry.pain)}`).join(" ");
  const energyPoints = chartEntries.map((entry, index) => `${xFor(index)},${yFor(entry.capacity)}`).join(" ");
  const labelStep = chartEntries.length > 9 ? 2 : 1;
  const labels = chartEntries.map((entry, index) => {
    if (index !== 0 && index !== chartEntries.length - 1 && index % labelStep !== 0) {
      return "";
    }

    const date = new Date(`${entry.date || ""}T12:00:00`);
    const label = Number.isNaN(date.getTime())
      ? `${index + 1}`
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `<text x="${xFor(index)}" y="${height - 10}" text-anchor="middle">${escapeHtml(label)}</text>`;
  }).join("");
  const dots = chartEntries.map((entry, index) => `
    <circle class="trend-point pain-point" cx="${xFor(index)}" cy="${yFor(entry.pain)}" r="4">
      <title>${escapeHtml(entry.date || "Entry")}: ${entry.pain}/10 pain</title>
    </circle>
    <circle class="trend-point energy-point" cx="${xFor(index)}" cy="${yFor(entry.capacity)}" r="4">
      <title>${escapeHtml(entry.date || "Entry")}: ${entry.capacity}/10 energy</title>
    </circle>
  `).join("");

  trendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Line chart comparing pain and energy over time">
      <g class="trend-grid">
        <line x1="${padding.left}" y1="${yFor(10)}" x2="${width - padding.right}" y2="${yFor(10)}"></line>
        <line x1="${padding.left}" y1="${yFor(7.5)}" x2="${width - padding.right}" y2="${yFor(7.5)}"></line>
        <line x1="${padding.left}" y1="${yFor(5)}" x2="${width - padding.right}" y2="${yFor(5)}"></line>
        <line x1="${padding.left}" y1="${yFor(2.5)}" x2="${width - padding.right}" y2="${yFor(2.5)}"></line>
        <line x1="${padding.left}" y1="${yFor(0)}" x2="${width - padding.right}" y2="${yFor(0)}"></line>
        <text x="10" y="${yFor(10) + 4}">10</text>
        <text x="14" y="${yFor(5) + 4}">5</text>
        <text x="16" y="${yFor(0) + 4}">0</text>
      </g>
      <polyline class="trend-line pain-line" points="${painPoints}"></polyline>
      <polyline class="trend-line energy-line" points="${energyPoints}"></polyline>
      <g class="trend-dots">${dots}</g>
      <g class="trend-labels">${labels}</g>
    </svg>
  `;
}

function renderConnections(entries) {
  const bodyEntries = entries.filter((entry) => entry.type !== "missed" && Number.isFinite(Number(entry.pain)));

  if (bodyEntries.length < 2) {
    connectionSummary.textContent = "Add at least two body notes to compare what helped and what spent energy.";
    positiveConnections.innerHTML = "";
    negativeConnections.innerHTML = "";
    return;
  }

  const baselinePain = average(bodyEntries.map((entry) => Number(entry.pain)));
  const baselineCapacity = average(bodyEntries.map((entry) => Number(entry.capacity)));
  const positive = collectImpactStats(bodyEntries, "helped", baselinePain, baselineCapacity, "positive");
  const negative = collectImpactStats(bodyEntries, "worsened", baselinePain, baselineCapacity, "negative");

  if (!positive.length && !negative.length) {
    connectionSummary.textContent = "Add positive and negative impacts to entries to start drawing connections.";
    positiveConnections.innerHTML = "";
    negativeConnections.innerHTML = "";
    return;
  }

  connectionSummary.textContent = `Compared with your baseline of ${baselinePain.toFixed(1)} pain and ${baselineCapacity.toFixed(1)} energy. These are clues, not conclusions.`;
  positiveConnections.innerHTML = renderConnectionGroup(positive, "positive");
  negativeConnections.innerHTML = renderConnectionGroup(negative, "negative");
}

function collectImpactStats(entries, key, baselinePain, baselineCapacity, kind) {
  const stats = new Map();

  entries.forEach((entry) => {
    splitTags(entry[key]).forEach((tag) => {
      if (!stats.has(tag)) {
        stats.set(tag, {
          tag,
          count: 0,
          painTotal: 0,
          capacityTotal: 0
        });
      }

      const stat = stats.get(tag);
      stat.count += 1;
      stat.painTotal += Number(entry.pain);
      stat.capacityTotal += Number(entry.capacity);
    });
  });

  return [...stats.values()]
    .map((stat) => {
      const painAverage = stat.painTotal / stat.count;
      const capacityAverage = stat.capacityTotal / stat.count;
      const painShift = painAverage - baselinePain;
      const capacityShift = capacityAverage - baselineCapacity;
      const score = kind === "positive"
        ? capacityShift - painShift
        : painShift - capacityShift;

      return {
        ...stat,
        painAverage,
        capacityAverage,
        painShift,
        capacityShift,
        score
      };
    })
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 3);
}

function renderConnectionGroup(items, kind) {
  if (!items.length) {
    return `<p class="quiet-note">No ${kind} impacts recorded yet.</p>`;
  }

  return items.map((item) => {
    const painDirection = describeShift(item.painShift, "pain");
    const capacityDirection = describeShift(item.capacityShift, "energy");
    const label = kind === "positive" ? "helps" : "harder";

    return `
      <article class="connection-item">
        <div class="connection-topline">
          <strong>${escapeHtml(item.tag)}</strong>
          <span class="connection-kind ${kind === "negative" ? "negative" : ""}">${label}</span>
        </div>
        <p class="connection-detail">
          Appeared ${item.count} ${item.count === 1 ? "time" : "times"}.
          Average: ${item.painAverage.toFixed(1)} pain, ${item.capacityAverage.toFixed(1)} energy.
          ${painDirection}; ${capacityDirection}.
        </p>
      </article>
    `;
  }).join("");
}

function describeShift(value, label) {
  if (Math.abs(value) < 0.2) {
    return `${label} about the same`;
  }

  const direction = value > 0 ? "higher" : "lower";
  return `${Math.abs(value).toFixed(1)} ${direction} ${label}`;
}

function makePatternNote(painAverage, capacityAverage) {
  if (painAverage >= 7 && capacityAverage <= 4) {
    return "Your recent entries suggest high pain and low energy. This is a good place for fewer demands and more support.";
  }

  if (capacityAverage >= 6) {
    return "Your energy has had some room lately. Notice what supports made that possible.";
  }

  return "Patterns are forming slowly. Keep the notes small enough to be repeatable.";
}

function renderMissedPanel(entries) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const dismissedDate = localStorage.getItem(missedDismissedKey);
  const datedEntries = entries
    .filter((entry) => entry.date)
    .sort((a, b) => new Date(`${b.date}T12:00:00`) - new Date(`${a.date}T12:00:00`));

  if (!datedEntries.length || dismissedDate === todayKey) {
    missedPanel.hidden = true;
    return;
  }

  const lastDate = new Date(`${datedEntries[0].date}T12:00:00`);
  const todayDate = new Date(`${todayKey}T12:00:00`);
  const daysAway = Math.floor((todayDate - lastDate) / 86400000);

  if (daysAway <= 1) {
    missedPanel.hidden = true;
    return;
  }

  missedTitle.textContent = daysAway === 2
    ? "You were away for a day. We are glad you are back."
    : `You were away for ${daysAway - 1} days. We are glad you are back.`;
  missedCopy.textContent = "No catching up required. You can mark what got in the way, or simply let this be the day you returned.";
  missedPanel.hidden = false;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rotatePrompt() {
  const current = promptText.textContent;
  const available = prompts.filter((prompt) => prompt !== current);
  promptText.textContent = available[Math.floor(Math.random() * available.length)];
}

function updateEntrySummary(entries = readEntries()) {
  const bodyEntryCount = entries.filter((entry) => entry.type !== "missed").length;
  if (!entrySummaryLabel) {
    return;
  }
  entrySummaryLabel.textContent = bodyEntryCount
    ? "Small entries still count."
    : "Start with one tiny note.";
}

function applyPreferences() {
  const saved = readPreferences();
  const preferences = {
    profileName: "Kindling",
    avatar: "cat",
    drink: "tea",
    theme: "meadow",
    mode: "light",
    ...saved
  };
  const resolvedMode = preferences.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : preferences.mode === "dark"
      ? "dark"
      : "light";

  document.body.dataset.drink = preferences.drink;
  document.body.dataset.theme = preferences.theme;
  document.body.dataset.mode = resolvedMode;
  document.body.dataset.modeChoice = preferences.mode;
  document.body.dataset.avatar = preferences.avatar;
  brandName.textContent = preferences.profileName || "Kindling";
  brandSubtitle.textContent = `${preferences.avatar} profile`;
  avatarImage.src = avatarSvgDataUrl(preferences.avatar);
  profileNameInput.value = preferences.profileName || "";
  avatarSelect.value = preferences.avatar;
  drinkSelect.value = preferences.drink;
  themeSelect.value = preferences.theme;
  modeSelect.value = preferences.mode;

  const drinkName = preferences.drink === "cocoa" ? "cocoa" : preferences.drink;
  heroDescription.textContent = `Track pain, energy, context, and tiny supports with a warm cup of ${drinkName}.`;
}

function updatePreference(key, value) {
  const preferences = {
    ...readPreferences(),
    profileName: profileNameInput.value.trim() || "Kindling",
    avatar: avatarSelect.value,
    drink: drinkSelect.value,
    theme: themeSelect.value,
    mode: modeSelect.value,
    [key]: value
  };
  delete preferences.companion;
  delete preferences.plant;
  delete preferences.weather;
  delete preferences.weatherSource;
  writePreferences(preferences);
  applyPreferences();
}

function routeToHash() {
  const hash = window.location.hash.replace("#", "") || "today";
  const page = ["patterns", "customize", "entries"].includes(hash) ? hash : "today";

  document.querySelectorAll(".page-view").forEach((section) => {
    section.classList.toggle("active-page", section.dataset.page === page);
  });
  document.querySelectorAll(".nav-list a").forEach((link) => {
    const target = link.getAttribute("href").replace("#", "");
    link.classList.toggle("active", target === hash || (page === "today" && target === "today" && !["patterns", "connections"].includes(hash)));
  });

  if (hash === "connections") {
    requestAnimationFrame(() => document.querySelector(`#${hash}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

painInput.addEventListener("input", updateRanges);
capacityInput.addEventListener("input", updateRanges);
document.querySelector("#new-prompt").addEventListener("click", rotatePrompt);
document.querySelector("#add-location").addEventListener("click", addCustomLocation);
editLocationsButton.addEventListener("click", () => {
  setFocusAreasEditing(!focusAreasEditing);
});
document.querySelector("#add-positive-impact").addEventListener("click", () => {
  if (customPositiveImpactInput) {
    addCustomImpact(customPositiveImpactInput, customPositiveImpactsKey, "helped");
    return;
  }
  addImpactsFromEntryInput("helped", customPositiveImpactsKey);
});
document.querySelector("#add-negative-impact").addEventListener("click", () => {
  if (customNegativeImpactInput) {
    addCustomImpact(customNegativeImpactInput, customNegativeImpactsKey, "worsened");
    return;
  }
  addImpactsFromEntryInput("worsened", customNegativeImpactsKey);
});
customLocationInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCustomLocation();
  }
});
customPositiveImpactInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCustomImpact(customPositiveImpactInput, customPositiveImpactsKey, "helped");
  }
});
customNegativeImpactInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addCustomImpact(customNegativeImpactInput, customNegativeImpactsKey, "worsened");
  }
});
document.querySelector("#entry-form").addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-impact-action]");
  if (actionButton) {
    const { impactAction, impactOriginal, targetInput } = actionButton.dataset;
    if (impactAction === "edit") {
      editImpactSuggestion(targetInput, impactOriginal);
    }
    if (impactAction === "remove") {
      removeImpactSuggestion(targetInput, impactOriginal);
    }
    return;
  }

  const chip = event.target.closest("[data-impact]");
  if (!chip) {
    return;
  }

  appendImpactToInput(document.querySelector(`#${chip.dataset.targetInput}`), chip.dataset.impact);
});
document.querySelector("#location-chips").addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-location]");
  if (editButton) {
    event.preventDefault();
    renameLocationSection(editButton.dataset.editLocation);
    return;
  }

  const button = event.target.closest("[data-remove-location]");
  if (!button) {
    return;
  }

  event.preventDefault();
  removeLocationSection(button.dataset.removeLocation);
});
document.querySelector("#location-chips").addEventListener("change", renderPainDetailFields);
entriesList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit-entry]");
  if (!button) {
    return;
  }

  loadEntryForEditing(button.dataset.editEntry);
});
profileNameInput.addEventListener("input", () => {
  updatePreference("profileName", profileNameInput.value.trim() || "Kindling");
  syncActiveProfile();
});
avatarSelect.addEventListener("change", () => {
  updatePreference("avatar", avatarSelect.value);
  syncActiveProfile();
});
profileSelect.addEventListener("change", () => switchProfile(profileSelect.value));
newProfileButton.addEventListener("click", createNewProfile);
drinkSelect.addEventListener("change", () => updatePreference("drink", drinkSelect.value));
themeSelect.addEventListener("change", () => updatePreference("theme", themeSelect.value));
modeSelect.addEventListener("change", () => updatePreference("mode", modeSelect.value));
const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
colorSchemeQuery.addEventListener?.("change", applyPreferences);
window.addEventListener("hashchange", routeToHash);

document.querySelector("#clear-sample").addEventListener("click", () => {
  if (!readEntries().length) {
    return;
  }

  const confirmed = window.confirm("Clear all local entries from this browser?");
  if (confirmed) {
    writeEntries([]);
    localStorage.removeItem(missedDismissedKey);
    renderEntries();
  }
});

document.querySelector("#dismiss-missed").addEventListener("click", () => {
  localStorage.setItem(missedDismissedKey, new Date().toISOString().slice(0, 10));
  missedPanel.hidden = true;
});

missedForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const reason = document.querySelector("input[name='missed-reason']:checked");
  const entries = readEntries();
  entries.push({
    id: crypto.randomUUID(),
    type: "missed",
    createdAt: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    pain: null,
    capacity: null,
    locations: [],
    context: reason ? reason.value : "No explanation",
    helped: "",
    worsened: "",
    note: missedNote.value.trim() || "I came back, and that counts."
  });

  writeEntries(entries);
  localStorage.setItem(missedDismissedKey, new Date().toISOString().slice(0, 10));
  missedForm.reset();
  renderEntries();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const entries = readEntries();
  const entryData = {
    date: dateInput.value,
    pain: Number(painInput.value),
    capacity: Number(capacityInput.value),
    locations: selectedLocations(),
    locationDetails: selectedLocationDetails(),
    context: document.querySelector("#context").value.trim(),
    helped: document.querySelector("#helped").value.trim(),
    worsened: document.querySelector("#worsened").value.trim(),
    note: document.querySelector("#note").value.trim()
  };

  if (editingEntryId) {
    const existingIndex = entries.findIndex((entry) => entry.id === editingEntryId);
    if (existingIndex >= 0) {
      entries[existingIndex] = {
        ...entries[existingIndex],
        ...entryData,
        updatedAt: Date.now()
      };
    } else {
      entries.push({
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...entryData
      });
    }
  } else {
    entries.push({
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...entryData
    });
  }

  writeEntries(entries);
  form.reset();
  dateInput.value = today.toISOString().slice(0, 10);
  painInput.value = 5;
  capacityInput.value = 5;
  resetEditingState();
  resetLocationChips();
  updateRanges();
  rotatePrompt();
  renderEntries();
});

updateRanges();
renderCustomLocations();
renderImpactOptions();
renderProfiles();
applyPreferences();
renderEntries();
routeToHash();
