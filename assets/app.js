/* Passport Switch: load JSON, render the selected passport's rules. */
(function () {
  "use strict";

  var STATUS_ORDER = ["visa_free", "visa_on_arrival", "evisa", "eta", "visa_required"];
  var STATUS_LABELS = {
    visa_free: "Visa-free",
    visa_on_arrival: "Visa on arrival",
    evisa: "eVisa",
    eta: "ETA",
    visa_required: "Visa required"
  };
  var STATUS_NOTES = {
    visa_free: "No visa needed before or on arrival for a short visit.",
    visa_on_arrival: "Visa issued at the border. Check where it is issued before you fly.",
    evisa: "Apply online before travel. Do not fly without the approval.",
    eta: "Electronic travel authorisation before travel. Not a visa, but still required.",
    visa_required: "Apply at an embassy or consulate before travel."
  };

  var state = { passport: "VN", status: "all", query: "" };
  var passports = [];
  var rules = [];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function escapeQuery(q) { return q.trim().toLowerCase(); }

  function filteredRules() {
    var q = escapeQuery(state.query);
    return rules.filter(function (r) {
      if (r.passport !== state.passport) return false;
      if (state.status !== "all" && r.status !== state.status) return false;
      if (q && r.destination.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function renderPicker() {
    var picker = document.getElementById("passport-picker");
    picker.innerHTML = "";
    passports.forEach(function (p) {
      var btn = el("button", "passport-btn");
      btn.type = "button";
      btn.setAttribute("aria-pressed", p.code === state.passport ? "true" : "false");
      btn.dataset.code = p.code;
      var name = el("span", null, p.name + " passport");
      var sub = el("small", null, "Henley " + p.henley_score + " destinations (" + p.henley_as_of + ")");
      btn.appendChild(name);
      btn.appendChild(sub);
      btn.addEventListener("click", function () {
        state.passport = p.code;
        renderPicker();
        renderResults();
      });
      picker.appendChild(btn);
    });
    var current = passports.filter(function (p) { return p.code === state.passport; })[0];
    var heading = document.getElementById("current-passport");
    if (current) heading.textContent = "Travelling on a " + current.name + " passport";
  }

  function renderCard(r) {
    var card = el("article", "card");
    card.dataset.status = r.status;
    card.appendChild(el("h3", null, r.destination));
    var meta = el("div", "meta");
    var badge = el("span", "badge", STATUS_LABELS[r.status] || r.status);
    badge.dataset.status = r.status;
    meta.appendChild(badge);
    meta.appendChild(el("span", "duration", r.duration));
    if (r.fee) meta.appendChild(el("span", "fee", "Fee: " + r.fee));
    card.appendChild(meta);
    if (r.conditions && r.conditions.length) {
      var listTitle = el("p", null, "Conditions");
      listTitle.style.margin = "6px 0 0";
      listTitle.style.fontWeight = "700";
      listTitle.style.fontSize = "0.9rem";
      card.appendChild(listTitle);
      var ul = el("ul");
      r.conditions.forEach(function (c) { ul.appendChild(el("li", null, c)); });
      card.appendChild(ul);
    }
    if (r.extension) card.appendChild(el("p", "extension", "Extension: " + r.extension));
    if (r.notes) card.appendChild(el("p", "notes", r.notes));
    var src = el("p", "source-line");
    src.appendChild(document.createTextNode("Verified " + r.verified + " · "));
    var a = el("a", null, r.source.name);
    a.href = r.source.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    src.appendChild(a);
    card.appendChild(src);
    return card;
  }

  function renderResults() {
    var container = document.getElementById("results");
    var countEl = document.getElementById("result-count");
    container.innerHTML = "";
    var list = filteredRules();
    var totalForPassport = rules.filter(function (r) { return r.passport === state.passport; }).length;
    countEl.textContent = list.length + " of " + totalForPassport + " verified destinations shown";
    if (!list.length) {
      var empty = el("div", "empty", "No verified destinations match this view. Unverified destinations are omitted on purpose: see the coverage note below.");
      container.appendChild(empty);
      return;
    }
    STATUS_ORDER.forEach(function (status) {
      var group = list.filter(function (r) { return r.status === status; });
      if (!group.length) return;
      group.sort(function (a, b) { return a.destination.localeCompare(b.destination); });
      var title = el("h2", "group-title", STATUS_LABELS[status]);
      title.appendChild(el("span", "group-count", "(" + group.length + ")"));
      container.appendChild(title);
      container.appendChild(el("p", "group-note", STATUS_NOTES[status]));
      var grid = el("div", "grid");
      group.forEach(function (r) { grid.appendChild(renderCard(r)); });
      container.appendChild(grid);
    });
  }

  function renderCoverage() {
    var box = document.getElementById("coverage");
    if (!box) return;
    var counts = {};
    passports.forEach(function (p) { counts[p.code] = 0; });
    rules.forEach(function (r) { counts[r.passport] = (counts[r.passport] || 0) + 1; });
    box.innerHTML = "";
    box.appendChild(el("strong", null, "Coverage in this version: "));
    var parts = passports.map(function (p) {
      return p.name + " " + (counts[p.code] || 0) + " destinations";
    });
    box.appendChild(document.createTextNode(parts.join(" · ") + ". Destinations with no verified official source are omitted, not guessed."));
  }

  function showError(message) {
    var container = document.getElementById("results");
    container.innerHTML = "";
    container.appendChild(el("div", "error", message));
  }

  function init() {
    var statusSelect = document.getElementById("status-filter");
    var searchInput = document.getElementById("search");
    statusSelect.addEventListener("change", function () {
      state.status = statusSelect.value;
      renderResults();
    });
    searchInput.addEventListener("input", function () {
      state.query = searchInput.value;
      renderResults();
    });

    Promise.all([
      fetch("data/passports.json").then(function (res) {
        if (!res.ok) throw new Error("Could not load passports.json");
        return res.json();
      }),
      fetch("data/rules.json").then(function (res) {
        if (!res.ok) throw new Error("Could not load rules.json");
        return res.json();
      })
    ]).then(function (pair) {
      passports = pair[0];
      rules = pair[1];
      if (passports.length && !passports.some(function (p) { return p.code === state.passport; })) {
        state.passport = passports[0].code;
      }
      renderPicker();
      renderResults();
      renderCoverage();
    }).catch(function () {
      showError("Could not load the visa data. If you opened this file directly, serve the folder with a local web server instead (see README).");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
