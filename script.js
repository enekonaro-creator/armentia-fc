"use strict";

const state = {
  data: null,
  language: "eu"
};

const selectors = {
  menuToggle: document.querySelector("[data-menu-toggle]"),
  navigation: document.querySelector("[data-nav]"),
  roster: document.querySelector("[data-roster]"),
  rosterNote: document.querySelector("[data-roster-note]"),
  achievements: document.querySelector("[data-achievements]"),
  sponsors: document.querySelector("[data-sponsors]"),
  gallery: document.querySelector("[data-gallery]"),
  nextMatch: document.querySelector("[data-next-match]"),
  lastMatch: document.querySelector("[data-last-match]"),
  fixtures: document.querySelector("[data-fixtures]"),
  standings: document.querySelector("[data-standings]"),
  standingsTable: document.querySelector("[data-standings-table]"),
  standingsEmpty: document.querySelector("[data-standings-empty]"),
  syncStatus: document.querySelector("[data-sync-status]"),
  dataFootnote: document.querySelector("[data-data-footnote]"),
  lastSync: document.querySelector("[data-last-sync]"),
  statsSummary: document.querySelector("[data-stats-summary]"),
  playerChart: document.querySelector("[data-player-chart]"),
  standingsLink: document.querySelector("[data-standings-link]"),
  lightbox: document.querySelector("[data-lightbox]"),
  lightboxImage: document.querySelector("[data-lightbox-image]"),
  lightboxCaption: document.querySelector("[data-lightbox-caption]"),
  lightboxClose: document.querySelector("[data-lightbox-close]")
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function translate(key) {
  return state.data?.translations?.[state.language]?.[key] ?? key;
}

function localized(value) {
  if (typeof value === "string") return value;
  return value?.[state.language] ?? value?.eu ?? value?.es ?? "";
}

function formatDate(value) {
  const locale = state.language === "eu" ? "eu-ES" : "es-ES";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatShortDate(value) {
  const locale = state.language === "eu" ? "eu-ES" : "es-ES";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatSyncDate(value) {
  const locale = state.language === "eu" ? "eu-ES" : "es-ES";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function applyTranslations() {
  document.documentElement.lang = state.language;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = translate(key);
  });

  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.lang === state.language));
  });

  if (selectors.rosterNote) {
    selectors.rosterNote.textContent = translate(
      state.data.rosterStatus === "confirmed" ? "rosterConfirmed" : "rosterProvisional"
    );
  }

  const descriptions = {
    eu: "Armentia FC, Gasteizko futbol 7 taldea. 2026/27 denboraldiko partidak, taldea eta berriak.",
    es: "Armentia FC, equipo de fútbol 7 de Vitoria-Gasteiz. Partidos, plantilla y novedades de la temporada 2026/27."
  };
  document.querySelector('meta[name="description"]')?.setAttribute("content", descriptions[state.language]);
}

function renderMatchCard(container, match, type) {
  container.replaceChildren();

  if (!match) {
    const empty = element("div", "match-card-state", translate(type === "next" ? "matchPending" : "resultPending"));
    container.append(empty);
    return;
  }

  const label = element("div", "match-label");
  label.append(
    element("span", "", translate(type === "next" ? "nextMatch" : "lastMatch")),
    element("time", "match-date", formatDate(match.date))
  );

  const teams = element("div", "match-teams");
  const armentia = element("span", "match-team", "Armentia FC");
  const opponent = element("span", "match-team", match.opponent);
  const centre = element(
    "span",
    type === "next" ? "match-versus" : "match-score",
    type === "next" ? "VS" : `${match.goalsFor}–${match.goalsAgainst}`
  );

  if (match.home) {
    teams.append(armentia, centre, opponent);
  } else {
    teams.append(opponent, centre, armentia);
  }

  const meta = element("p", "match-meta");
  meta.append(
    element("span", "", translate(match.home ? "home" : "away")),
    element("span", "", match.venue || ""),
    element("span", "", localized(match.competition))
  );

  container.append(label, teams, meta);
}

function renderAchievements() {
  selectors.achievements.replaceChildren();
  state.data.achievements.forEach((achievement) => {
    const item = element("div", "stat");
    item.append(
      element("strong", "", achievement.value),
      element("span", "", localized(achievement.label))
    );
    selectors.achievements.append(item);
  });
}

function renderRoster() {
  selectors.roster.replaceChildren();
  [...state.data.players]
    .sort((a, b) => a.number - b.number)
    .forEach((player) => {
      const card = element("article", "player-card");
      card.dataset.number = player.number;
      card.append(
        element("span", "player-number", String(player.number).padStart(2, "0")),
        element("span", "player-name", player.name)
      );
      selectors.roster.append(card);
    });
}

function renderFixtureList(titleKey, matches, className) {
  const group = element("section", `fixture-group ${className}`);
  group.append(element("h4", "fixture-group-title", translate(titleKey)));

  if (!matches.length) {
    group.append(element("p", "panel-empty", translate(className === "played" ? "noPlayedMatches" : "noUpcomingMatches")));
    return group;
  }

  const list = element("div", "fixture-list");
  matches.forEach((match) => {
    const item = element("article", "fixture-row");
    const round = element("span", "fixture-round", `${translate("roundShort")} ${match.round ?? "–"}`);
    const opponent = element("strong", "fixture-opponent", match.opponent);
    const detail = element("span", "fixture-detail", `${formatShortDate(match.date)} · ${translate(match.home ? "home" : "away")}`);
    const result = match.goalsFor === undefined || match.goalsFor === null
      ? element("span", "fixture-time", translate("pending"))
      : element("strong", "fixture-result", `${match.goalsFor}–${match.goalsAgainst}`);
    item.append(round, opponent, detail, result);
    list.append(item);
  });
  group.append(list);
  return group;
}

function renderFixtures() {
  selectors.fixtures.replaceChildren();
  const matches = Array.isArray(state.data.matches) ? state.data.matches : [];
  const played = matches.filter((match) => Number.isInteger(match.goalsFor)).reverse();
  const upcoming = matches.filter((match) => !Number.isInteger(match.goalsFor));
  selectors.fixtures.append(
    renderFixtureList("playedMatches", played, "played"),
    renderFixtureList("upcomingMatches", upcoming, "upcoming")
  );

  const synced = state.data.dataSource?.updatedAt;
  if (synced) {
    selectors.syncStatus.textContent = translate("syncedData");
    selectors.syncStatus.dataset.ready = "true";
    selectors.lastSync.textContent = formatSyncDate(synced);
    selectors.lastSync.dateTime = synced;
    selectors.dataFootnote.hidden = false;
  } else {
    selectors.syncStatus.textContent = translate("waitingData");
    delete selectors.syncStatus.dataset.ready;
    selectors.dataFootnote.hidden = true;
  }
}

function renderStandings() {
  selectors.standings.replaceChildren();
  const rows = Array.isArray(state.data.standings) ? state.data.standings : [];
  selectors.standingsTable.hidden = rows.length === 0;
  selectors.standingsEmpty.hidden = rows.length > 0;

  rows.forEach((team) => {
    const row = element("tr", team.isArmentia ? "is-armentia" : "");
    [
      team.position,
      team.isArmentia ? "Armentia FC" : team.team,
      team.points,
      team.played,
      team.won,
      team.drawn,
      team.lost,
      `${team.goalsFor}/${team.goalsAgainst}`
    ].forEach((value, index) => {
      const cell = element(index === 1 ? "th" : "td", "", value);
      if (index === 1) cell.scope = "row";
      row.append(cell);
    });
    selectors.standings.append(row);
  });
}

function renderPlayerStats() {
  selectors.statsSummary.replaceChildren();
  selectors.playerChart.replaceChildren();

  const savedStats = new Map((state.data.playerStats ?? []).map((item) => [item.number, item]));
  const players = state.data.players
    .map((player) => ({ ...player, goals: savedStats.get(player.number)?.goals ?? 0, assists: savedStats.get(player.number)?.assists ?? 0 }))
    .filter((player) => player.goals > 0 || player.assists > 0)
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists) || b.goals - a.goals);

  if (!players.length) {
    selectors.statsSummary.hidden = true;
    selectors.playerChart.append(element("p", "stats-empty", translate("noStats")));
    return;
  }

  selectors.statsSummary.hidden = false;
  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];
  const topAssister = [...players].sort((a, b) => b.assists - a.assists)[0];
  const totals = players.reduce((sum, player) => ({ goals: sum.goals + player.goals, assists: sum.assists + player.assists }), { goals: 0, assists: 0 });
  [
    { value: topScorer.goals, label: translate("topScorer"), name: topScorer.name },
    { value: topAssister.assists, label: translate("topAssister"), name: topAssister.name },
    { value: totals.goals, label: translate("teamGoals"), name: `${totals.assists} ${translate("assists").toLowerCase()}` }
  ].forEach((stat) => {
    const card = element("article", "summary-stat");
    card.append(element("span", "summary-label", stat.label), element("strong", "summary-value", stat.value), element("span", "summary-name", stat.name));
    selectors.statsSummary.append(card);
  });

  const maxContributions = Math.max(...players.map((player) => player.goals + player.assists));
  players.forEach((player) => {
    const total = player.goals + player.assists;
    const row = element("article", "chart-row");
    const identity = element("div", "chart-identity");
    identity.append(element("span", "chart-number", String(player.number).padStart(2, "0")), element("strong", "chart-name", player.name));
    const track = element("div", "chart-track");
    const bar = element("span", "chart-bar");
    bar.style.width = `${Math.max(8, (total / maxContributions) * 100)}%`;
    track.append(bar);
    const values = element("span", "chart-values", `${player.goals} ${translate("goalStatShort")} · ${player.assists} ${translate("assistStatShort")}`);
    const totalNode = element("strong", "chart-total", total);
    totalNode.setAttribute("aria-label", `${total} ${translate("contributions")}`);
    row.append(identity, track, values, totalNode);
    selectors.playerChart.append(row);
  });
}

function renderSponsors() {
  selectors.sponsors.replaceChildren();
  state.data.sponsors.forEach((sponsor) => {
    const link = element("a", "sponsor-card");
    link.href = sponsor.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", sponsor.name);

    const image = element("img");
    image.src = sponsor.logo;
    image.alt = sponsor.name;
    image.loading = "lazy";
    image.decoding = "async";
    link.append(image);
    selectors.sponsors.append(link);
  });
}

function openLightbox(item) {
  selectors.lightboxImage.src = item.src;
  selectors.lightboxImage.alt = localized(item.alt);
  selectors.lightboxCaption.textContent = localized(item.alt);
  selectors.lightbox.showModal();
}

function renderGallery() {
  selectors.gallery.replaceChildren();
  state.data.gallery.forEach((item) => {
    const button = element("button", "gallery-item");
    button.type = "button";
    button.setAttribute("aria-label", localized(item.alt));

    const image = element("img");
    image.src = item.src;
    image.alt = localized(item.alt);
    image.loading = "lazy";
    image.decoding = "async";
    button.append(image);
    button.addEventListener("click", () => openLightbox(item));
    selectors.gallery.append(button);
  });
}

function renderDynamicContent() {
  document.querySelectorAll("[data-season]").forEach((node) => {
    node.textContent = state.data.season;
  });

  renderMatchCard(selectors.nextMatch, state.data.nextMatch, "next");
  renderMatchCard(selectors.lastMatch, state.data.lastMatch, "last");
  renderAchievements();
  renderRoster();
  renderFixtures();
  renderStandings();
  renderPlayerStats();
  renderSponsors();
  renderGallery();

  if (state.data.standingsUrl) {
    selectors.standingsLink.href = state.data.standingsUrl;
    selectors.standingsLink.hidden = false;
  } else {
    selectors.standingsLink.hidden = true;
  }
}

function setLanguage(language) {
  if (!state.data.translations[language]) return;
  state.language = language;
  localStorage.setItem("armentia-language", language);
  applyTranslations();
  renderDynamicContent();
}

function closeMenu() {
  selectors.menuToggle.setAttribute("aria-expanded", "false");
  selectors.navigation.dataset.open = "false";
  document.body.classList.remove("menu-open");
}

function bindInteractions() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });

  selectors.menuToggle.addEventListener("click", () => {
    const isOpen = selectors.menuToggle.getAttribute("aria-expanded") === "true";
    selectors.menuToggle.setAttribute("aria-expanded", String(!isOpen));
    selectors.navigation.dataset.open = String(!isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  selectors.navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  selectors.lightboxClose.addEventListener("click", () => selectors.lightbox.close());
  selectors.lightbox.addEventListener("click", (event) => {
    if (event.target === selectors.lightbox) selectors.lightbox.close();
  });
}

async function initialize() {
  document.querySelector("[data-year]").textContent = new Date().getFullYear();

  try {
    const response = await fetch("data/site.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();

    const savedLanguage = localStorage.getItem("armentia-language");
    state.language = state.data.translations[savedLanguage]
      ? savedLanguage
      : state.data.defaultLanguage;

    applyTranslations();
    renderDynamicContent();
    bindInteractions();
  } catch (error) {
    console.error("No se han podido cargar los datos de la web:", error);
    const message = "Ezin izan dira denboraldiko datuak kargatu / No se han podido cargar los datos de la temporada.";
    selectors.nextMatch.replaceChildren(element("div", "match-card-state", message));
    selectors.lastMatch.replaceChildren(element("div", "match-card-state", message));
    selectors.roster.replaceChildren(element("p", "", message));
  }
}

initialize();
