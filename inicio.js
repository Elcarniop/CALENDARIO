async function validarLogin() {
  const usuario    = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contrasena').value;
  const errDiv     = document.getElementById('error-msg');

  if (!usuario || !contrasena) {
    errDiv.textContent   = 'Por favor complete todos los campos.';
    errDiv.style.display = 'block';
    return;
  }

  try {
    const res  = await fetch('../api/auth.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ usuario, contrasena }),
    });
    const json = await res.json();

    if (!json.ok) {
      errDiv.textContent   = json.data || 'Credenciales incorrectas.';
      errDiv.style.display = 'block';
      return;
    }

    if (json.data.rol === 'admin')   window.location.href = '../html/administrador.html';
    if (json.data.rol === 'oficina') window.location.href = '../html/oficina.html';

  } catch {
    errDiv.textContent   = 'Error de conexión. Verifique que XAMPP esté corriendo.';
    errDiv.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('contrasena')
    .addEventListener('keydown', e => { if (e.key === 'Enter') validarLogin(); });
});