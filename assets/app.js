/* Passport Switch: load JSON, render the selected passport's index.
   Three sections: destinations, "with another visa", transit. Search filters
   all three by destination; the status filter applies to destinations only. */
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
    visa_free: "No visa needed for a short visit.",
    visa_on_arrival: "Visa issued at the border.",
    evisa: "Apply online before you travel.",
    eta: "Authorisation before travel. Not a visa.",
    visa_required: "Apply at an embassy or consulate first."
  };
  var TRANSIT_ORDER = ["transit_visa", "transit_visa_restricted"];
  var TRANSIT_LABELS = {
    transit_visa: "Transit visa — exemption with a held visa",
    transit_visa_restricted: "Transit visa — no exemption"
  };
  var TRANSIT_NOTES = {
    transit_visa: "Needed airside, unless a held visa exempts you.",
    transit_visa_restricted: "Needed airside. No held-visa exemption."
  };

  var state = { passport: "VN", status: "all", query: "" };
  var passports = [];
  var rules = [];
  var substitute = [];
  var transit = [];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function escapeQuery(q) { return q.trim().toLowerCase(); }

  function matchesQuery(item) {
    var q = escapeQuery(state.query);
    return !q || item.destination.toLowerCase().indexOf(q) !== -1;
  }

  function forPassport(list) {
    return list.filter(function (r) { return r.passport === state.passport; });
  }

  function filteredRules() {
    return forPassport(rules).filter(function (r) {
      if (state.status !== "all" && r.status !== state.status) return false;
      return matchesQuery(r);
    });
  }

  function filteredSubstitute() {
    return forPassport(substitute).filter(matchesQuery);
  }

  function filteredTransit() {
    return forPassport(transit).filter(matchesQuery);
  }

  function byDestination(a, b) { return a.destination.localeCompare(b.destination); }

  function countsFor(code) {
    function n(list) {
      return list.filter(function (r) { return r.passport === code; }).length;
    }
    return { rules: n(rules), substitute: n(substitute), transit: n(transit) };
  }

  function currentPassport() {
    var found = passports.filter(function (p) { return p.code === state.passport; })[0];
    return found || null;
  }

  function renderPicker() {
    var picker = document.getElementById("passport-picker");
    picker.innerHTML = "";
    passports.forEach(function (p) {
      var btn = el("button", "segment");
      btn.type = "button";
      btn.setAttribute("aria-pressed", p.code === state.passport ? "true" : "false");
      btn.dataset.code = p.code;
      btn.appendChild(el("span", "segment-code", p.code));
      btn.appendChild(el("span", "segment-name", p.name));
      btn.addEventListener("click", function () {
        state.passport = p.code;
        renderPicker();
        renderResults();
      });
      picker.appendChild(btn);
    });
    var current = currentPassport();
    var meta = document.getElementById("picker-meta");
    if (current && meta) {
      var c = countsFor(current.code);
      meta.textContent = current.name + " passport · Henley " + current.henley_score +
        " destinations (" + current.henley_as_of + ") · " +
        c.rules + " destinations · " + c.substitute + " another-visa · " + c.transit + " transit";
    }
  }

  function renderHeroFacts() {
    var facts = document.getElementById("hero-facts");
    if (!facts) return;
    var total = rules.length + substitute.length + transit.length;
    facts.textContent = passports.length + " passports · " + total +
      " verified entries · Every entry dated and sourced.";
  }

  function appendConditions(row, item) {
    if (item.conditions && item.conditions.length) {
      row.appendChild(el("p", "conditions-title", "Conditions"));
      var ul = el("ul");
      item.conditions.forEach(function (c) { ul.appendChild(el("li", null, c)); });
      row.appendChild(ul);
    }
  }

  function appendSourceLine(row, item) {
    var src = el("p", "source-line");
    src.appendChild(document.createTextNode("Verified " + item.verified + " · "));
    if (/wikipedia/i.test(item.source.name)) {
      src.appendChild(el("span", "wiki-flag", "Wikipedia source · "));
    }
    var a = el("a", null, item.source.name);
    a.href = item.source.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    src.appendChild(a);
    row.appendChild(src);
  }

  function renderMainRow(r, headingTag) {
    var row = el("article", "row");
    row.dataset.status = r.status;
    var head = el("div", "row-head");
    head.appendChild(el(headingTag, null, r.destination));
    var chip = el("span", "chip" + (r.status === "visa_required" ? " chip-dark" : ""), STATUS_LABELS[r.status] || r.status);
    chip.dataset.status = r.status;
    head.appendChild(chip);
    head.appendChild(el("span", "duration", r.duration));
    if (r.fee) head.appendChild(el("span", "fee", "Fee: " + r.fee));
    row.appendChild(head);
    appendConditions(row, r);
    if (r.extension) row.appendChild(el("p", "extension", "Extension: " + r.extension));
    if (r.notes) row.appendChild(el("p", "notes", r.notes));
    appendSourceLine(row, r);
    return row;
  }

  function appendHeldChips(row, item) {
    if (item.held_visas && item.held_visas.length) {
      var held = el("div", "held");
      held.appendChild(el("span", "held-label", "Held visa:"));
      item.held_visas.forEach(function (h) { held.appendChild(el("span", "held-chip", h)); });
      row.appendChild(held);
    }
  }

  function renderExtraRow(item, headingTag, isTransit) {
    var row = el("article", "row");
    if (isTransit) row.dataset.status = item.status;
    var head = el("div", "row-head");
    head.appendChild(el(headingTag, null, item.destination));
    if (isTransit) {
      var chip = el("span", "chip" + (item.status === "transit_visa_restricted" ? " chip-dark" : ""), TRANSIT_LABELS[item.status] || item.status);
      chip.dataset.status = item.status;
      head.appendChild(chip);
    } else {
      head.appendChild(el("span", "chip", "With another visa"));
    }
    head.appendChild(el("span", "duration", item.duration));
    if (item.fee) head.appendChild(el("span", "fee", "Fee: " + item.fee));
    row.appendChild(head);
    var device = el("p", "hold-line");
    device.appendChild(el("span", "hold", "Hold: " + item.requires));
    var arrow = el("span", "arrow", "→");
    arrow.setAttribute("aria-hidden", "true");
    device.appendChild(arrow);
    device.appendChild(el("span", "benefit", item.benefit));
    row.appendChild(device);
    appendHeldChips(row, item);
    appendConditions(row, item);
    if (item.notes) row.appendChild(el("p", "notes", item.notes));
    appendSourceLine(row, item);
    return row;
  }

  function sectionHead(title, countText) {
    var head = el("div", "section-head");
    head.appendChild(el("h2", null, title));
    head.appendChild(el("span", "section-count", countText));
    return head;
  }

  function emptyNote(text) {
    return el("div", "empty", text);
  }

  function renderMainSection(container) {
    var section = el("section", "section");
    section.id = "destinations";
    var list = filteredRules();
    var total = forPassport(rules).length;
    section.appendChild(sectionHead("Destinations", list.length + " of " + total + " shown"));
    document.getElementById("result-count").textContent =
      list.length + " of " + total + " verified destinations shown";
    if (!list.length) {
      section.appendChild(emptyNote("No verified destinations match this view."));
      container.appendChild(section);
      return;
    }
    STATUS_ORDER.forEach(function (status) {
      var group = list.filter(function (r) { return r.status === status; });
      if (!group.length) return;
      group.sort(byDestination);
      var title = el("h3", "group-title", STATUS_LABELS[status]);
      title.appendChild(el("span", "group-count", "(" + group.length + ")"));
      section.appendChild(title);
      section.appendChild(el("p", "group-note", STATUS_NOTES[status]));
      var rows = el("div", "rows");
      group.forEach(function (r) { rows.appendChild(renderMainRow(r, "h4")); });
      section.appendChild(rows);
    });
    container.appendChild(section);
  }

  function renderSubstituteSection(container) {
    var section = el("section", "section");
    section.id = "another-visa";
    var list = filteredSubstitute().sort(byDestination);
    var total = forPassport(substitute).length;
    section.appendChild(sectionHead("With another visa", list.length + " of " + total + " shown"));
    section.appendChild(el("p", "section-note", "Places a visa you already hold opens up."));
    if (!total) {
      section.appendChild(emptyNote("No verified entries for this passport yet."));
    } else if (!list.length) {
      section.appendChild(emptyNote("Nothing in this section matches your search."));
    } else {
      var rows = el("div", "rows");
      list.forEach(function (item) { rows.appendChild(renderExtraRow(item, "h3", false)); });
      section.appendChild(rows);
    }
    container.appendChild(section);
  }

  function renderTransitSection(container) {
    var section = el("section", "section");
    section.id = "transit";
    var list = filteredTransit();
    var total = forPassport(transit).length;
    section.appendChild(sectionHead("Transit visa", list.length + " of " + total + " shown"));
    section.appendChild(el("p", "section-note", "Visas needed even to stay airside. Places you can transit without one are not listed."));
    if (!total) {
      section.appendChild(emptyNote("No verified entries for this passport yet."));
    } else if (!list.length) {
      section.appendChild(emptyNote("Nothing in this section matches your search."));
    } else {
      TRANSIT_ORDER.forEach(function (status) {
        var group = list.filter(function (r) { return r.status === status; });
        if (!group.length) return;
        group.sort(byDestination);
        var title = el("h3", "group-title", TRANSIT_LABELS[status]);
        title.appendChild(el("span", "group-count", "(" + group.length + ")"));
        section.appendChild(title);
        section.appendChild(el("p", "group-note", TRANSIT_NOTES[status]));
        var rows = el("div", "rows");
        group.forEach(function (item) { rows.appendChild(renderExtraRow(item, "h4", true)); });
        section.appendChild(rows);
      });
    }
    container.appendChild(section);
  }

  function renderResults() {
    var container = document.getElementById("results");
    container.innerHTML = "";
    renderMainSection(container);
    renderSubstituteSection(container);
    renderTransitSection(container);
  }

  function renderCoverage() {
    var box = document.getElementById("coverage");
    if (!box) return;
    box.innerHTML = "";
    box.appendChild(el("strong", null, "Coverage in this version: "));
    var parts = passports.map(function (p) {
      var c = countsFor(p.code);
      return p.name + " " + c.rules + " destinations, " + c.substitute + " with another visa, " + c.transit + " transit";
    });
    box.appendChild(document.createTextNode(parts.join(" · ") + ". Entries with no verified source are omitted, not guessed."));
  }

  function showError(message) {
    var container = document.getElementById("results");
    container.innerHTML = "";
    container.appendChild(el("div", "error", message));
  }

  function loadJson(path, label) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error("Could not load " + label);
      return res.json();
    });
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
      loadJson("data/passports.json", "passports.json"),
      loadJson("data/rules.json", "rules.json"),
      loadJson("data/substitute_visa.json", "substitute_visa.json"),
      loadJson("data/transit.json", "transit.json")
    ]).then(function (parts) {
      passports = parts[0];
      rules = parts[1];
      substitute = parts[2];
      transit = parts[3];
      if (passports.length && !passports.some(function (p) { return p.code === state.passport; })) {
        state.passport = passports[0].code;
      }
      renderPicker();
      renderHeroFacts();
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
