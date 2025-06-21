// adv-search.js

const gradeList = [
  "L", "5", "5+", "6A", "6A+", "6B", "6B+", "6C", "6C+",
  "7A", "7A+", "7B", "7B+", "7C", "7C+", "8A", "8A+", "8B", "8B+", "8C"
];

document.addEventListener("DOMContentLoaded", () => {
  const gradeSlider = document.getElementById("grade-slider");
  const gradeDisplay = document.getElementById("grade-range-display");

  let minGradeIndex = 0;
  let maxGradeIndex = gradeList.length - 1;

  noUiSlider.create(gradeSlider, {
    start: [0, gradeList.length - 1],
    connect: true,
    step: 1,
    range: {
      min: 0,
      max: gradeList.length - 1
    },
    format: {
      to: value => Math.round(value),
      from: value => Number(value)
    }
  });

  gradeSlider.noUiSlider.on("update", (values) => {
    minGradeIndex = values[0];
    maxGradeIndex = values[1];
    gradeDisplay.textContent = `${gradeList[minGradeIndex]} – ${gradeList[maxGradeIndex]}`;
  });

  const expoToggle = document.getElementById("toggle-expo");
  expoToggle.addEventListener("click", () => {
    if (!expoToggle.classList.contains("active") && !expoToggle.classList.contains("no-expo")) {
      expoToggle.classList.add("active");
    } else if (expoToggle.classList.contains("active")) {
      expoToggle.classList.remove("active");
      expoToggle.classList.add("no-expo");
    } else {
      expoToggle.classList.remove("no-expo");
    }
  });

  // Standard binary toggles for stars (★ and ☆)
  ["toggle-full", "toggle-hollow"].forEach(id => {
    document.getElementById(id).addEventListener("click", () => {
      document.getElementById(id).classList.toggle("active");
    });
  });

  const regionSelect = document.getElementById("region-select");
  const areaSelect = document.getElementById("area-select");
  const sectorSelect = document.getElementById("sector-select");
  const sectorGroup = document.getElementById("sector-group");
  const stylesContainer = document.getElementById("styles-container");
  const styleOptions = [
    "arete", "bulge", "crack", "dihedral", "dyno", "mantle", "overhang", "pillar", "prow", "roof", "slab",
    "slightly overhanging", "traverse", "wall",
    "edges", "compression", "pockets", "slopers", "underclings",
    "morpho", "lowball", "seeping"
  ];

  const row1 = ["arete", "bulge", "crack", "dihedral", "dyno", "mantle", "overhang", "pillar", "prow", "roof", "slab", "slightly overhanging", "traverse", "wall"];
  const row2 = ["edges", "compression", "pockets", "slopers", "underclings"];
  const row3 = ["morpho", "lowball", "seeping"];

  const rows = [row1, row2, row3];

  rows.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "style-row";
    row.forEach(style => {
      const label = document.createElement("label");
      label.className = "style-checkbox";
      label.innerHTML = `<input type="checkbox" value="${style}" /> ${style}`;
      rowDiv.appendChild(label);
    });
    stylesContainer.appendChild(rowDiv);
  });

  let allRows = [];
  const sheetUrl = `https://docs.google.com/spreadsheets/d/1VwZM08gTUNHlpWGDaBUWnYdiqgUFicWoD3fDJJwE7rU/gviz/tq?tqx=out:json&sheet=databas`;

  fetch(sheetUrl)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text.substring(47).slice(0, -2));
      allRows = json.table.rows.map(r => r.c).slice(1);

      const areas = new Map();         // Map of area → { region, sectors: Set }
      const regions = new Set();

      allRows.forEach(cols => {
        const region = cols[1]?.v;
        const area = cols[2]?.v;
        const sector = cols[3]?.v;
        if (region && area && sector) {
          regions.add(region);
          if (!areas.has(area)) {
            areas.set(area, { region: region, sectors: new Set() });
          }
          areas.get(area).sectors.add(sector);
        }
      });

      const desiredRegionOrder = ["KJUGEKULL", "NORTH", "WEST", "EAST", "OTHER"];
      desiredRegionOrder.forEach(region => {
        if (regions.has(region)) {
          regionSelect.innerHTML += `<option value="${region}">${region}</option>`;
        }
      });

      function updateAreaDropdown() {
        const selectedRegion = regionSelect.value;
        areaSelect.innerHTML = `<option value="">-- Select Area --</option>`;

        for (const [area, data] of areas.entries()) {
          if (!selectedRegion || data.region === selectedRegion) {
            areaSelect.innerHTML += `<option value="${area}">${area}</option>`;
          }
        }

        // Trigger sector visibility update
        areaSelect.dispatchEvent(new Event("change"));
      }

      regionSelect.addEventListener("change", updateAreaDropdown);
      updateAreaDropdown(); // Initial call

      areaSelect.addEventListener("change", () => {
        const area = areaSelect.value;
        const areaData = areas.get(area);

        if (!area || !areaData || !areaData.sectors) {
          sectorGroup.style.display = "none";
          return;
        }

        sectorGroup.style.display = "block";
        sectorSelect.innerHTML = `<option value="">-- Select Sector --</option>`;

        [...areaData.sectors].sort().forEach(sector => {
          sectorSelect.innerHTML += `<option value="${sector}">${sector}</option>`;
        });
      });
    });

  document.getElementById("search-button").addEventListener("click", () => {
    const nameFilter = document.getElementById("name-filter").value.toLowerCase();
    const minIndex = minGradeIndex;
    const maxIndex = maxGradeIndex;

    const expoEl = document.getElementById("toggle-expo");
    const expoMode = expoEl.classList.contains("active")
      ? "require"
      : expoEl.classList.contains("no-expo")
      ? "exclude"
      : "any";
    const requireFull = document.getElementById("toggle-full").classList.contains("active");
    const requireHollow = document.getElementById("toggle-hollow").classList.contains("active");

    const selectedRegion = regionSelect.value;
    const selectedArea = areaSelect.value;
    const selectedSector = sectorSelect.value;
    const selectedStyles = [...stylesContainer.querySelectorAll("input:checked")].map(cb => cb.value.toLowerCase());

    const resultsBox = document.getElementById("adv-search-results");
    resultsBox.innerHTML = `
      <div class="results-heading">
        Results <span id="results-count" style="margin-left: 6px; font-weight: normal; color: #aaa;"></span>
      </div>`;

    const matched = allRows.filter(cols => {
      const name = cols[8]?.v?.toLowerCase();
      const grade = cols[9]?.v;
      const expo = cols[11]?.v;
      const rating = cols[12]?.v;
      const region = cols[1]?.v;
      const area = cols[2]?.v;
      const sector = cols[3]?.v;
      const styles = (cols[21]?.v || "").toLowerCase().split(',').map(s => s.trim());

      const gradePos = gradeList.indexOf(grade);
      if (!name || !grade || gradePos < minIndex || gradePos > maxIndex) return false;
      if (nameFilter && !name.includes(nameFilter)) return false;
      if (expoMode === "require" && expo !== "!") return false;
      if (expoMode === "exclude" && expo === "!") return false;
      if (requireFull && rating !== "★") return false;
      if (requireHollow && rating !== "☆") return false;
      if (selectedRegion && region !== selectedRegion) return false;
      if (selectedArea && area !== selectedArea) return false;
      if (selectedSector && sector !== selectedSector) return false;
      if (selectedStyles.length > 0 && !selectedStyles.every(s => styles.includes(s))) return false;

      return true;
    });

    if (matched.length === 0) {
      resultsBox.innerHTML += `<p>No matching problems found.</p>`;
    } else {
      document.getElementById("results-count").textContent = `${matched.length}`;
      let lastSector = null;
      let lastBlocNr = null;

      matched.forEach(cols => {
        const name = cols[8]?.v;
        const grade = cols[9]?.v;
        const rating = cols[12]?.v || "";
        const expo = cols[11]?.v || "";
        const sector = cols[3]?.v || "";
        const blocNr = cols[4]?.v || "";

        // Detect group break
        const isNewGroup = sector !== lastSector || blocNr !== lastBlocNr;
        lastSector = sector;
        lastBlocNr = blocNr;

        const div = document.createElement("div");
        div.className = "result-row";

        if (isNewGroup) {
          div.style.marginTop = "16px"; // add vertical gap between groups
        }

        div.innerHTML = `
          <div class="problem-row">
            <a href="problem.html?name=${encodeURIComponent(name)}" class="problem-name-link">
              <strong>${name}</strong>
            </a>
            <span class="problem-meta">
              <span class="grade">${grade}</span>
              <span class="rating">${rating}</span>
              <span class="expo">${expo}</span>
            </span>
          </div>
        `;

        resultsBox.appendChild(div);
      });
    }
  });
});
