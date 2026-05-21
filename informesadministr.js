const API_INF = '../api/informes.php';
let resultadosActuales = [];

async function generarInforme() {
  const params = new URLSearchParams({ tipo: 'actividades' });
  const estado      = document.getElementById('estado').value;
  const tipo        = document.getElementById('tipo').value;
  const oficina     = document.getElementById('oficina').value.trim();
  const descripcion = document.getElementById('descripcionFiltro').value.trim();
  const fechaInicio = document.getElementById('fechaInicio').value;
  const fechaFin    = document.getElementById('fechaFin').value;

  if (estado)      params.set('estado',         estado);
  if (tipo)        params.set('tipo_actividad',  tipo);
  if (oficina)     params.set('oficina',         oficina);
  if (descripcion) params.set('descripcion',     descripcion);
  if (fechaInicio) params.set('fecha_inicio',    fechaInicio);
  if (fechaFin)    params.set('fecha_fin',       fechaFin);

  try {
    const res  = await fetch(`${API_INF}?${params}`);
    const json = await res.json();
    if (!json.ok) { alert(json.data); return; }
    resultadosActuales = json.data;
    renderizarInforme(resultadosActuales);
  } catch { alert('Error de conexión con el servidor.'); }
}

async function cargarHistorial() {
  try {
    const res  = await fetch(`${API_INF}?tipo=historial`);
    const json = await res.json();
    if (!json.ok) { alert(json.data); return; }
    const cont = document.getElementById('resultados');
    cont.innerHTML = '';
    json.data.forEach(h => {
      const div = document.createElement('div');
      div.className = 'report-card';
      div.innerHTML = `
        <p><strong>Actividad:</strong> ${h.actividad_nombre ?? '(eliminada)'}</p>
        <p><strong>Acción:</strong> ${h.accion}</p>
        <p><strong>Realizado por:</strong> ${h.realizado_por}</p>
        <p><strong>Fecha:</strong> ${h.fecha}</p>`;
      cont.appendChild(div);
    });
  } catch { alert('Error al cargar historial.'); }
}

function renderizarInforme(lista) {
  const cont = document.getElementById('resultados');
  cont.innerHTML = '';
  if (lista.length === 0) {
    cont.innerHTML = '<p>No se encontraron actividades con los filtros seleccionados.</p>'; return;
  }
  lista.forEach(a => {
    const div = document.createElement('div');
    div.className = 'report-card';
    div.innerHTML = `
      <p><strong>Actividad:</strong> ${a.nombre}</p>
      <p><strong>Descripción:</strong> ${a.descripcion}</p>
      <p><strong>Lugar:</strong> ${a.lugar}</p>
      <p><strong>Responsable:</strong> ${a.responsable}</p>
      <p><strong>Tipo:</strong> ${a.tipo}</p>
      <p><strong>Repetitiva:</strong> ${a.es_repetitiva ? 'Sí' : 'No'}</p>
      <p><strong>Inicio:</strong> ${a.fecha_inicio} — <strong>Fin:</strong> ${a.fecha_fin}</p>
      <p><strong>Estado:</strong> ${a.estado}</p>`;
    cont.appendChild(div);
  });
}

function exportar(formato) {
  if (resultadosActuales.length === 0) { alert('Primero genere un informe.'); return; }
  if (formato === 'PDF') {
    alert('Imprima la página con Ctrl+P y seleccione "Guardar como PDF".');
    window.print(); return;
  }
  const sep = formato === 'Excel' ? ';' : ',';
  const cols = ['nombre','descripcion','lugar','responsable','tipo','es_repetitiva','fecha_inicio','fecha_fin','estado'];
  const csv  = [cols.join(sep),
    ...resultadosActuales.map(r => cols.map(c => `"${(r[c]??'').toString().replace(/"/g,'""')}"`).join(sep))
  ].join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const a    = Object.assign(document.createElement('a'),
                 { href: URL.createObjectURL(blob), download: 'informe.csv' });
  a.click(); URL.revokeObjectURL(a.href);
}

document.addEventListener('DOMContentLoaded', () => {
  const btnH = document.getElementById('btn-historial');
  if (btnH) btnH.addEventListener('click', cargarHistorial);
});