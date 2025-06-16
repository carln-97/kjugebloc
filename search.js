// search.js
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  // Overlay HTML
  const overlay = document.createElement("div");
  overlay.id = "search-overlay";
  overlay.innerHTML = `
    <div id="search-box">
      <input type="text" id="search-input" placeholder="Search problems, areas, sectors, persons..." />
      <div id="search-results"></div>
    </div>
  `;
  body.appendChild(overlay);

  // Watchglass button behavior
  const searchIcon = document.getElementById("search-trigger");
  if (searchIcon) {
    searchIcon.style.cursor = "pointer";
    searchIcon.addEventListener("click", () => {
      overlay.style.display = "flex";
      document.getElementById("search-input").focus();
    });
  }

  overlay.addEventListener("click", (e) => {
    if (e.target.id === "search-overlay") {
      overlay.style.display = "none";
      document.getElementById("search-input").value = "";      // Clear input
      document.getElementById("search-results").innerHTML = ""; // Clear results
    }
  });

  const input = document.getElementById("search-input");
  const resultsBox = document.getElementById("search-results");

  let allRows = [];

  // Load data from Google Sheets once
  const sheetURL = `https://docs.google.com/spreadsheets/d/1VwZM08gTUNHlpWGDaBUWnYdiqgUFicWoD3fDJJwE7rU/gviz/tq?tqx=out:json&sheet=databas`;
  fetch(sheetURL)
    .then((res) => res.text())
    .then((text) => {
      const json = JSON.parse(text.substring(47).slice(0, -2));
      allRows = json.table.rows.map((row) => row.c);
    });

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase().trim();
    resultsBox.innerHTML = "";
    if (!query) return;

    const matches = {
      Problems: new Map(),
      Areas: new Map(),
      Sectors: new Map(),
      Persons: new Map()
    };

    for (let i = 1; i < allRows.length; i++) {
      const cols = allRows[i];
      const problem = cols[8]?.v;
      const area = cols[2]?.v;
      const sector = cols[3]?.v;
      const faName = cols[15]?.v;
      const captionsRaw = cols[19]?.v || '';

      // --- Problem ---
      if (problem?.toLowerCase().includes(query)) {
        const grade = cols[9]?.v || '';
        const label = problem;
        const display = `${label}|||${grade}`; // pack both into a string
        matches.Problems.set(label, { href: `problem.html?name=${encodeURIComponent(problem)}`, grade });
      }

      // --- Area ---
      if (area?.toLowerCase().includes(query)) {
        matches.Areas.set(area, `area.html?area=${encodeURIComponent(area)}`);
      }

      // --- Sector ---
      if (sector?.toLowerCase().includes(query)) {
        const area = cols[2]?.v || '';
        matches.Sectors.set(sector, {
          href: `sector.html?sector=${encodeURIComponent(sector)}`,
          area
        });
      }

      // --- Person (from faName) ---
      if (faName?.toLowerCase().includes(query)) {
        matches.Persons.set(faName, `person.html?name=${encodeURIComponent(faName)}`);
      }

      // --- Person (from captions) ---
      const captionMatches = [...captionsRaw.matchAll(/Climber:\s*([^\n,;]+?)(?:\s+on\b|[,;]|$)/gi)];

      captionMatches.forEach(match => {
        const extractedName = match[1]?.trim();
        if (
          extractedName &&
          extractedName.toLowerCase().includes(query) &&
          !matches.Persons.has(extractedName)
        ) {
          matches.Persons.set(extractedName, `person.html?name=${encodeURIComponent(extractedName)}`);
        }
      });
    }

    for (const [category, map] of Object.entries(matches)) {
      if (map.size === 0) continue;

      const group = document.createElement("div");
      group.className = "result-group";

      const heading = document.createElement("div");
      heading.className = "result-heading";
      heading.textContent = category.toUpperCase();
      group.appendChild(heading);

      if (category === "Problems") {
        for (const [label, data] of map.entries()) {
          const item = document.createElement("a");
          item.href = data.href;
          item.className = "result-item";
          item.innerHTML = `
            ${label} <span style="font-weight: bold; color: #777; margin-left: 6px;">${data.grade}</span>
          `;
          group.appendChild(item);
        }
      } else {
          if (category === "Problems") {
            for (const [label, data] of map.entries()) {
              const item = document.createElement("a");
              item.href = data.href;
              item.className = "result-item";
              item.innerHTML = `
                ${label} <span style="font-weight: bold; color: #777; margin-left: 6px;">${data.grade}</span>
              `;
              group.appendChild(item);
            }
          } else if (category === "Sectors") {
            for (const [label, data] of map.entries()) {
              const item = document.createElement("a");
              item.href = data.href;
              item.className = "result-item";
              item.innerHTML = `
                ${label} <span style="font-weight: normal; color: #777; margin-left: 6px;">${data.area}</span>
              `;
              group.appendChild(item);
            }
          } else {
            for (const [label, href] of map.entries()) {
              const item = document.createElement("a");
              item.href = href;
              item.className = "result-item";
              item.textContent = label;
              group.appendChild(item);
            }
          }
      }

      resultsBox.appendChild(group);
    }
  });
});