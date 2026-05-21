const API = 'api/actividades.php';
const COLORES = { Cultural: '#b50303', Academica: '#004c97', Ludica: '#2e7d32' };
let todasActividades = [];
let mesActual  = new Date().getMonth();
let anioActual = new Date().getFullYear();

async function cargarCalendario() {
  try {
    const res  = await fetch(API);
    const json = await res.json();
    if (!json.ok) return;
    todasActividades = json.data;
    renderizarCalendario();
    mostrarProximas();
    verificarNotificaciones();
  } catch { console.error('Error cargando actividades'); }
}

function renderizarCalendario() {
  const cont     = document.getElementById('calendario');
  if (!cont) return;
  const hoy      = new Date();
  const meses    = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const primerDia = new Date(anioActual, mesActual, 1).getDay();
  const diasMes   = new Date(anioActual, mesActual + 1, 0).getDate();

  const mapa = {};
  todasActividades.forEach(a => {
    const d = new Date(a.fecha_inicio);
    if (d.getMonth() === mesActual && d.getFullYear() === anioActual) {
      const dia = d.getDate();
      if (!mapa[dia]) mapa[dia] = [];
      mapa[dia].push(a);
    }
  });

  let html = `
    <div class="cal-nav">
      <button onclick="cambiarMes(-1)">&#8249;</button>
      <span>${meses[mesActual]} ${anioActual}</span>
      <button onclick="cambiarMes(1)">&#8250;</button>
    </div>
    <div class="cal-grid">
      ${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
          .map(d => `<div class="cal-header">${d}</div>`).join('')}
      ${'<div class="cal-day empty"></div>'.repeat(primerDia)}`;

  for (let d = 1; d <= diasMes; d++) {
    const esHoy  = hoy.getDate()===d && hoy.getMonth()===mesActual && hoy.getFullYear()===anioActual;
    const puntos = (mapa[d] || []).map(a =>
      `<span class="punto" style="background:${COLORES[a.tipo]||'#888'}" title="${a.nombre}"></span>`
    ).join('');
    html += `<div class="cal-day ${esHoy?'hoy':''}" onclick="mostrarDia(${d})">
               <span class="num-dia">${d}</span>
               <div class="puntos-dia">${puntos}</div>
             </div>`;
  }

  cont.innerHTML = html + '</div>';
}

function cambiarMes(delta) {
  mesActual += delta;
  if (mesActual > 11) { mesActual = 0; anioActual++; }
  if (mesActual < 0)  { mesActual = 11; anioActual--; }
  renderizarCalendario();
}

function mostrarDia(dia) {
  const fecha = `${anioActual}-${String(mesActual+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
  const acts  = todasActividades.filter(a => a.fecha_inicio === fecha);
  const modal = document.getElementById('modal-dia');
  const cont  = document.getElementById('modal-contenido');
  if (!modal) return;

  document.getElementById('modal-titulo').textContent = `Actividades del ${dia}/${mesActual+1}/${anioActual}`;
  cont.innerHTML = acts.length === 0 ? '<p>No hay actividades para este día.</p>'
    : acts.map(a => `
        <div class="activity-box" style="border-left-color:${COLORES[a.tipo]||'#888'}">
          <strong>${a.nombre}</strong><br>
          ${a.descripcion}<br>
          🕐 ${a.hora_inicio} – ${a.hora_fin} &nbsp;|&nbsp; 📍 ${a.lugar}<br>
          🏢 ${a.oficina_nombre} &nbsp;
          <span style="color:${COLORES[a.tipo]||'#888'}">${a.tipo}</span>
        </div>`).join('');
  modal.style.display = 'flex';
}

function cerrarModal() {
  const m = document.getElementById('modal-dia');
  if (m) m.style.display = 'none';
}

function mostrarProximas() {
  const cont = document.getElementById('proximas-actividades');
  if (!cont) return;
  const hoy     = new Date();
  const proximas = todasActividades.filter(a => new Date(a.fecha_inicio) >= hoy).slice(0, 5);
  cont.innerHTML = proximas.length === 0 ? '<p>No hay actividades próximas.</p>'
    : proximas.map(a => `
        <div class="proxima-card" style="border-left:4px solid ${COLORES[a.tipo]||'#888'}">
          <strong>${a.nombre}</strong>
          <small>${a.fecha_inicio} ${a.hora_inicio} · ${a.lugar}</small>
          <span class="tipo-badge" style="background:${COLORES[a.tipo]||'#888'}">${a.tipo}</span>
        </div>`).join('');
}

function verificarNotificaciones() {
  const manana    = new Date(); manana.setDate(manana.getDate() + 1);
  const mananaStr = manana.toISOString().split('T')[0];
  const proximas  = todasActividades.filter(a => a.fecha_inicio === mananaStr);
  if (proximas.length > 0 && 'Notification' in window) {
    Notification.requestPermission().then(p => {
      if (p === 'granted') proximas.forEach(a =>
        new Notification('📅 Vive el Campus', { body: `Mañana: ${a.nombre} en ${a.lugar}` })
      );
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarCalendario();
  const modal = document.getElementById('modal-dia');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) cerrarModal(); });
});