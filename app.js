
let entries = JSON.parse(localStorage.getItem("entries")) || [];
let hourlyRate = parseFloat(localStorage.getItem("hourlyRate")) || 0;
let onAccount = parseFloat(localStorage.getItem("onAccount")) || 0;
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

window.onload = () => {
  populateTimeOptions();
  document.getElementById("date").valueAsDate = new Date();
  document.getElementById("rate").value = hourlyRate;
  document.getElementById("account").value = onAccount;
  updateMonthSelect();
  render();
};

function populateTimeOptions() {
  let startSelect = document.getElementById("start");
  let endSelect = document.getElementById("end");
  for (let h=0; h<24; h++) {
    for (let m=0; m<60; m+=30) {
      let time = (""+h).padStart(2,"0")+":"+(""+m).padStart(2,"0");
      let opt1 = document.createElement("option");
      opt1.value = time; opt1.text = time; startSelect.add(opt1.cloneNode(true));
      endSelect.add(opt1);
    }
  }
  startSelect.value = "07:00";
  let now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes()/30)*30);
  endSelect.value = (""+now.getHours()).padStart(2,"0")+":"+((""+now.getMinutes()).padStart(2,"0"));
}

function addEntry() {
  let date = document.getElementById("date").value;
  let start = document.getElementById("start").value;
  let end = document.getElementById("end").value;
  let note = document.getElementById("note").value;
  let bonus = parseFloat(document.getElementById("bonus").value) || 0;

  let hours = calculateHours(start, end);
  entries.push({date, start, end, note, bonus, hours});
  localStorage.setItem("entries", JSON.stringify(entries));
  render();
}

function calculateHours(start, end) {
  let [sh, sm] = start.split(":").map(Number);
  let [eh, em] = end.split(":").map(Number);
  let startMins = sh*60+sm;
  let endMins = eh*60+em;
  if (endMins < startMins) endMins += 24*60;
  return (endMins - startMins)/60;
}

function render() {
  let tbody = document.getElementById("entries-body");
  tbody.innerHTML = "";
  let filtered = entries.filter(e => {
    let d = new Date(e.date);
    return d.getMonth()===currentMonth && d.getFullYear()===currentYear;
  });
  filtered.sort((a,b)=> new Date(a.date)-new Date(b.date));
  for (let i=0; i<filtered.length; i++) {
    let e = filtered[i];
    let tr = document.createElement("tr");
    let date = new Date(e.date);
    let dayStr = date.toLocaleDateString("pl-PL",{weekday:"short", day:"numeric"});
    tr.innerHTML = `
      <td>${dayStr}</td>
      <td>${e.start} - ${e.end} (${e.hours}h)</td>
      <td>${e.note}</td>
      <td>${e.bonus.toFixed(2)}</td>
      <td>
        <button onclick="editEntry('${e.date}','${e.start}','${e.end}')">Edytuj</button>
        <button onclick="deleteEntry('${e.date}','${e.start}','${e.end}')">Usuń</button>
      </td>`;
    tbody.appendChild(tr);
  }
  updateSummary(filtered);
}

function editEntry(date,start,end) {
  let entry = entries.find(e=>e.date===date && e.start===start && e.end===end);
  if (!entry) return;
  document.getElementById("date").value = entry.date;
  document.getElementById("start").value = entry.start;
  document.getElementById("end").value = entry.end;
  document.getElementById("note").value = entry.note;
  document.getElementById("bonus").value = entry.bonus;
  deleteEntry(date,start,end);
}

function deleteEntry(date,start,end) {
  entries = entries.filter(e=> !(e.date===date && e.start===start && e.end===end));
  localStorage.setItem("entries", JSON.stringify(entries));
  render();
}

function saveSettings() {
  hourlyRate = parseFloat(document.getElementById("rate").value) || 0;
  onAccount = parseFloat(document.getElementById("account").value) || 0;
  localStorage.setItem("hourlyRate", hourlyRate);
  localStorage.setItem("onAccount", onAccount);
  render();
}

function updateSummary(filtered) {
  let totalHours = filtered.reduce((sum,e)=>sum+e.hours,0);
  let totalBonus = filtered.reduce((sum,e)=>sum+e.bonus,0);
  let workingDays = getWorkingDays(currentYear, currentMonth);
  let baseHours = workingDays*8 + 10;
  let overtime = Math.max(0, totalHours - baseHours);
  let regularHours = totalHours - overtime;
  let totalPay = regularHours*hourlyRate + overtime*hourlyRate*1.5 + totalBonus;
  let finalPay = totalPay - onAccount;

  document.getElementById("month-summary").innerText = 
    `Godziny bazowe: ${regularHours}, Nadgodziny: ${overtime}, ` +
    `Premie: ${totalBonus.toFixed(2)}, Do wypłaty: ${finalPay.toFixed(2)}`;
}

function getWorkingDays(year, month) {
  let date = new Date(year, month, 1);
  let days = 0;
  while (date.getMonth()===month) {
    let day = date.getDay();
    if (day!==0 && day!==6) days++;
    date.setDate(date.getDate()+1);
  }
  return days;
}

function toggleSettings() {
  document.getElementById("settings").classList.toggle("hidden");
}

function updateMonthSelect() {
  let select = document.getElementById("monthSelect");
  select.innerHTML = "";
  let months = [...new Set(entries.map(e=> {
    let d = new Date(e.date);
    return d.getFullYear()+"-"+d.getMonth();
  }))];
  if (!months.includes(currentYear+"-"+currentMonth)) months.push(currentYear+"-"+currentMonth);
  months.sort();
  for (let m of months) {
    let [y,mm] = m.split("-").map(Number);
    let opt = document.createElement("option");
    opt.value = m;
    let d = new Date(y,mm,1);
    opt.text = d.toLocaleDateString("pl-PL",{month:"long", year:"numeric"});
    if (y===currentYear && mm===currentMonth) opt.selected=true;
    select.add(opt);
  }
}

function changeMonth() {
  let val = document.getElementById("monthSelect").value;
  let [y,m] = val.split("-").map(Number);
  currentYear = y; currentMonth = m;
  render();
}
