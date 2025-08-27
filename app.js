let entries = JSON.parse(localStorage.getItem("entries") || "[]");
let settings = JSON.parse(localStorage.getItem("settings") || '{"rate":0,"payout":0}');
let editingIndex = null;

// Ustawienia miesiąca
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

// godziny co 30 min
function populateTimes() {
  let startSel = document.getElementById("start");
  let endSel = document.getElementById("end");
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      let time = `${String(h).padStart(2,"0")}:${m==0?"00":"30"}`;
      let opt1 = new Option(time, time);
      let opt2 = new Option(time, time);
      startSel.add(opt1.cloneNode(true));
      endSel.add(opt2.cloneNode(true));
    }
  }
}
populateTimes();

// domyślne wartości
document.getElementById("date").valueAsDate = new Date();
document.getElementById("rate").value = settings.rate;
document.getElementById("payout").value = settings.payout;

function saveSettings() {
  settings.rate = parseFloat(document.getElementById("rate").value) || 0;
  settings.payout = parseFloat(document.getElementById("payout").value) || 0;
  localStorage.setItem("settings", JSON.stringify(settings));
  render();
}

function addEntry() {
  let date = document.getElementById("date").value;
  let start = document.getElementById("start").value;
  let end = document.getElementById("end").value;
  let note = document.getElementById("note").value;
  let bonus = parseFloat(document.getElementById("bonus").value) || 0;

  let startH = parseInt(start.split(":")[0]) + parseInt(start.split(":")[1])/60;
  let endH = parseInt(end.split(":")[0]) + parseInt(end.split(":")[1])/60;
  if (endH < startH) endH += 24;
  let hours = endH - startH;

  let entry = {date, start, end, note, bonus, hours};

  if (editingIndex !== null) {
    entries[editingIndex] = entry;
    editingIndex = null;
  } else {
    entries.push(entry);
  }
  localStorage.setItem("entries", JSON.stringify(entries));
  render();
}

function editEntry(index) {
  let e = entries[index];
  document.getElementById("date").value = e.date;
  document.getElementById("start").value = e.start;
  document.getElementById("end").value = e.end;
  document.getElementById("note").value = e.note;
  document.getElementById("bonus").value = e.bonus;
  editingIndex = index;
}

function deleteEntry(index) {
  entries.splice(index,1);
  localStorage.setItem("entries", JSON.stringify(entries));
  render();
}

function render() {
  // Label miesiąca
  let label = new Date(currentYear, currentMonth).toLocaleString("pl-PL",{month:"long", year:"numeric"});
  document.getElementById("monthLabel").innerText = label;

  // filtr dla wybranego miesiąca
  let monthEntries = entries.filter(e=>{
    let d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).sort((a,b)=> new Date(a.date)-new Date(b.date));

  // tabela
  let tbody = document.querySelector("#entriesTable tbody");
  tbody.innerHTML = "";
  for (let [i,e] of monthEntries.entries()) {
    let d = new Date(e.date);
    let dayLabel = d.toLocaleDateString("pl-PL",{weekday:"short", day:"numeric"});
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dayLabel}</td>
      <td>${e.start} - ${e.end}</td>
      <td>${e.hours.toFixed(1)}</td>
      <td>${e.note}</td>
      <td>${e.bonus.toFixed(2)}</td>
      <td>
        <button onclick="editEntry(${entries.indexOf(e)})">✏️</button>
        <button onclick="deleteEntry(${entries.indexOf(e)})">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  }

  // podsumowanie
  let totalHours = monthEntries.reduce((s,e)=>s+e.hours,0);
  let totalBonus = monthEntries.reduce((s,e)=>s+e.bonus,0);

  // dni robocze
  let daysInMonth = new Date(currentYear, currentMonth+1,0).getDate();
  let workdays = 0;
  for (let d=1; d<=daysInMonth; d++){
    let day = new Date(currentYear,currentMonth,d).getDay();
    if (day!==0 && day!==6) workdays++;
  }
  let baseHours = workdays*8 + 10;
  let overtime = Math.max(0,totalHours-baseHours);
  let normalHours = totalHours - overtime;
  let pay = normalHours*settings.rate + overtime*settings.rate*1.5 + totalBonus;
  let netto = pay - settings.payout;

  document.getElementById("summary").innerHTML = `
    <p>Godziny w podstawie: ${normalHours.toFixed(1)} | Nadgodziny: ${overtime.toFixed(1)}</p>
    <p>Premie: ${totalBonus.toFixed(2)} zł</p>
    <p>Razem do wypłaty: ${pay.toFixed(2)} zł</p>
    <p>Na konto: ${settings.payout.toFixed(2)} zł</p>
    <p><b>Pozostaje: ${netto.toFixed(2)} zł</b></p>
  `;
}

function changeMonth(dir){
  currentMonth += dir;
  if (currentMonth<0){ currentMonth=11; currentYear--; }
  if (currentMonth>11){ currentMonth=0; currentYear++; }
  render();
}

render();

