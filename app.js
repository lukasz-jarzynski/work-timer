
// Zaokrąglanie do najbliższej pół godziny
function roundToNearestHalfHour(date) {
  let ms = 1000 * 60 * 30;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

function populateTimeSelects() {
  const start = document.getElementById("start");
  const end = document.getElementById("end");
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      let time = (h < 10 ? "0" + h : h) + ":" + (m === 0 ? "00" : "30");
      let option1 = document.createElement("option");
      option1.value = time;
      option1.text = time;
      start.appendChild(option1);
      let option2 = document.createElement("option");
      option2.value = time;
      option2.text = time;
      end.appendChild(option2);
    }
  }
}

function saveSettings() {
  const rate = parseFloat(document.getElementById("hourlyRate").value);
  if (!isNaN(rate)) {
    localStorage.setItem("hourlyRate", rate);
    alert("Zapisano stawkę: " + rate + " PLN/h");
    renderSummary();
  }
}

function loadSettings() {
  const rate = localStorage.getItem("hourlyRate");
  if (rate) document.getElementById("hourlyRate").value = rate;
}

function addEntry() {
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const note = document.getElementById("note").value;
  const bonus = parseFloat(document.getElementById("bonus").value) || 0;

  if (!date || !start || !end) {
    alert("Uzupełnij datę i godziny");
    return;
  }

  const entries = JSON.parse(localStorage.getItem("entries") || "[]");
  entries.push({ date, start, end, note, bonus });
  localStorage.setItem("entries", JSON.stringify(entries));
  renderEntries();
  renderSummary();
}

function renderEntries() {
  const entries = JSON.parse(localStorage.getItem("entries") || "[]");
  const container = document.getElementById("entries");
  container.innerHTML = "<h2>Wpisy</h2>";
  entries.forEach((e, i) => {
    container.innerHTML += `<div><b>${e.date}</b>: ${e.start} - ${e.end}, premia: ${e.bonus} PLN, notatka: ${e.note || "-"} </div>`;
  });
}

// obliczanie różnicy godzin
function diffHours(start, end) {
  let [sh, sm] = start.split(":").map(Number);
  let [eh, em] = end.split(":").map(Number);
  let startDate = new Date(0,0,0,sh,sm);
  let endDate = new Date(0,0,0,eh,em);
  return (endDate - startDate) / 1000 / 3600;
}

// obliczanie dni roboczych w miesiącu
function getWorkingDaysInMonth(year, month) {
  let days = new Date(year, month + 1, 0).getDate();
  let workdays = 0;
  for (let d = 1; d <= days; d++) {
    let day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) workdays++;
  }
  return workdays;
}

function renderSummary() {
  const entries = JSON.parse(localStorage.getItem("entries") || "[]");
  const rate = parseFloat(localStorage.getItem("hourlyRate") || "0");
  const now = new Date();
  const workdays = getWorkingDaysInMonth(now.getFullYear(), now.getMonth());
  const baseHoursLimit = workdays * 8 + 10;

  let totalHours = 0;
  let totalBonus = 0;
  let bonusList = [];

  entries.forEach(e => {
    let h = diffHours(e.start, e.end);
    totalHours += h;
    if (e.bonus) {
      totalBonus += e.bonus;
      if (e.note || e.bonus > 0) {
        bonusList.push({note: e.note, bonus: e.bonus});
      }
    }
  });

  let baseHours = Math.min(totalHours, baseHoursLimit);
  let overtimeHours = Math.max(0, totalHours - baseHoursLimit);

  let basePay = baseHours * rate;
  let overtimePay = overtimeHours * rate * 1.5;

  let summary = `
    <h2>Podsumowanie miesiąca</h2>
    <p>Dni robocze: ${workdays}</p>
    <p>Bazowe godziny: ${baseHoursLimit}</p>
    <p>Przepracowane godziny: ${totalHours.toFixed(2)}</p>
    <p>Godziny w podstawie: ${baseHours.toFixed(2)} = ${basePay.toFixed(2)} PLN</p>
    <p>Nadgodziny: ${overtimeHours.toFixed(2)} = ${overtimePay.toFixed(2)} PLN</p>
    <details><summary>Premie: ${totalBonus.toFixed(2)} PLN</summary>
      <ul>
        ${bonusList.map(b => `<li>${b.note || "-"}: ${b.bonus} PLN</li>`).join("")}
      </ul>
    </details>
    <h3>Razem do wypłaty: ${(basePay + overtimePay + totalBonus).toFixed(2)} PLN</h3>
  `;

  document.getElementById("summary").innerHTML = summary;
}

function init() {
  populateTimeSelects();
  loadSettings();
  renderEntries();
  renderSummary();

  let today = new Date();
  document.getElementById("date").value = today.toISOString().substr(0,10);

  // domyślne wartości godzin
  document.getElementById("start").value = "07:00";
  let roundedEnd = roundToNearestHalfHour(today);
  let eh = roundedEnd.getHours();
  let em = roundedEnd.getMinutes();
  let endStr = (eh<10?"0"+eh:eh) + ":" + (em===0?"00":"30");
  document.getElementById("end").value = endStr;
}

window.onload = init;
