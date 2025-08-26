function roundToNearestHalfHour(date) {
  let ms = 1000*60*30;
  return new Date(Math.ceil(date.getTime()/ms)*ms);
}

function populateTimeSelects() {
  const start = document.getElementById("start");
  const end = document.getElementById("end");
  for(let h=0;h<24;h++){
    for(let m of [0,30]){
      let t = (h<10?'0'+h:h)+':'+(m===0?'00':'30');
      let o1=document.createElement('option'); o1.value=t; o1.text=t; start.appendChild(o1);
      let o2=document.createElement('option'); o2.value=t; o2.text=t; end.appendChild(o2);
    }
  }
}

function toggleRate() {
  document.getElementById('rateSection').classList.toggle('hidden');
}

function saveSettings() {
  const r = parseFloat(document.getElementById('hourlyRate').value)||0;
  const a = parseFloat(document.getElementById('toAccount').value)||0;
  localStorage.setItem('hourlyRate', r);
  localStorage.setItem('toAccount', a);
  alert('Zapisano ustawienia');
  renderSummary();
}

function loadSettings() {
  const r = localStorage.getItem('hourlyRate');
  const a = localStorage.getItem('toAccount');
  if(r) document.getElementById('hourlyRate').value = r;
  if(a) document.getElementById('toAccount').value = a;
}

function addEntry() {
  const date = document.getElementById('date').value;
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  const note = document.getElementById('note').value;
  const bonus = parseFloat(document.getElementById('bonus').value)||0;
  if(!date||!start||!end){alert('Uzupełnij datę i godziny'); return;}
  const entries = JSON.parse(localStorage.getItem('entries')||'[]');
  entries.push({date,start,end,note,bonus});
  localStorage.setItem('entries', JSON.stringify(entries));
  renderEntries();
  renderSummary();
}

function editEntry(i) {
  const entries = JSON.parse(localStorage.getItem('entries')||'[]');
  const e = entries[i];
  document.getElementById('date').value = e.date;
  document.getElementById('start').value = e.start;
  document.getElementById('end').value = e.end;
  document.getElementById('note').value = e.note;
  document.getElementById('bonus').value = e.bonus;
  entries.splice(i,1);
  localStorage.setItem('entries', JSON.stringify(entries));
  renderEntries();
  renderSummary();
}

function deleteEntry(i) {
  const entries = JSON.parse(localStorage.getItem('entries')||'[]');
  if(confirm('Usuń wpis?')){
    entries.splice(i,1);
    localStorage.setItem('entries', JSON.stringify(entries));
    renderEntries();
    renderSummary();
  }
}

function diffHours(s,e) {
  let [sh,sm]=s.split(':').map(Number);
  let [eh,em]=e.split(':').map(Number);
  let start = new Date(0,0,0,sh,sm);
  let end = new Date(0,0,0,eh,em);
  return (end-start)/1000/3600;
}

function getWorkDays(y,m) {
  let days = new Date(y,m+1,0).getDate(), count=0;
  for(let d=1;d<=days;d++){
    let day = new Date(y,m,d).getDay();
    if(day!==0 && day!==6) count++;
  }
  return count;
}

function renderEntries() {
  let entries = JSON.parse(localStorage.getItem('entries')||'[]');
  entries.sort((a,b)=>a.date.localeCompare(b.date));
  const tbody = document.querySelector('#entriesTable tbody');
  tbody.innerHTML='';
  entries.forEach((e,i)=>{
    let h = diffHours(e.start,e.end);
    const tr = document.createElement('tr');
    tr.innerHTML=`<td>${e.date}</td><td>${e.note||'-'}</td><td>${e.bonus}</td><td>${h.toFixed(2)}</td><td class="actions"><button onclick="editEntry(${i})">✏️</button><button onclick="deleteEntry(${i})">🗑️</button></td>`;
    tbody.appendChild(tr);
  });
}

function renderSummary() {
  const entries = JSON.parse(localStorage.getItem('entries')||'[]');
  const rate = parseFloat(localStorage.getItem('hourlyRate')||'0');
  const toAcc = parseFloat(localStorage.getItem('toAccount')||'0');
  const now = new Date();
  const workdays = getWorkDays(now.getFullYear(), now.getMonth());
  const baseHoursLimit = workdays*8+10;

  let totalHours=0, totalBonus=0, bonusList=[];
  entries.forEach(e=>{
    let h=diffHours(e.start,e.end);
    totalHours+=h;
    if(e.bonus){totalBonus+=e.bonus; bonusList.push({note:e.note,bonus:e.bonus});}
  });

  let baseHours = Math.min(totalHours, baseHoursLimit);
  let overtimeHours = Math.max(0, totalHours - baseHoursLimit);
  let basePay = baseHours*rate;
  let overtimePay = overtimeHours*rate*1.5;
  let totalPay = basePay + overtimePay + totalBonus - toAcc;
  if(totalPay<0) totalPay=0;

  let summary=`<h2>Podsumowanie miesiąca</h2>
  <p>Dni bazowe: ${workdays} | Bazowe godziny: ${baseHoursLimit}</p>
  <p>Przepracowane godziny: ${totalHours.toFixed(2)}</p>
  <p>Godziny w podstawie: ${baseHours.toFixed(2)} = ${basePay.toFixed(2)} PLN | Nadgodziny: ${overtimeHours.toFixed(2)} = ${overtimePay.toFixed(2)} PLN</p>
  <details><summary>Premie: ${totalBonus.toFixed(2)} PLN</summary><ul>${bonusList.map(b=>`<li>${b.note||'-'}: ${b.bonus} PLN</li>`).join('')}</ul></details>
  <p>Na konto: ${toAcc.toFixed(2)} PLN</p>
  <h3>Razem do wypłaty: ${totalPay.toFixed(2)} PLN</h3>`;

  document.getElementById('summary').innerHTML=summary;
}

function init(){
  populateTimeSelects();
  loadSettings();
  renderEntries();
  renderSummary();
  let today = new Date();
  document.getElementById('date').value = today.toISOString().substr(0,10);
  document.getElementById('start').value = '07:00';
  let re = roundToNearestHalfHour(today);
  let eh = re.getHours(), em = re.getMinutes();
  document.getElementById('end').value = (eh<10?'0'+eh:eh)+':'+(em===0?'00':'30');
}

window.onload=init;
