<?php
require_once __DIR__ . '/../conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$rol    = $_SESSION['rol']     ?? null;
$userId = $_SESSION['id']      ?? null;
$quien  = $_SESSION['usuario'] ?? 'desconocido';

if ($metodo === 'GET') {
    try {
        $pdo = conectar();

        if (!empty($_GET['id'])) {
            $stmt = $pdo->prepare(
                "SELECT a.*, o.nombre AS oficina_nombre
                   FROM actividades a
                   JOIN oficinas o ON o.id = a.oficina_id
                  WHERE a.id = ?"
            );
            $stmt->execute([(int)$_GET['id']]);
            $act = $stmt->fetch();
            if (!$act) responder('Actividad no encontrada.', false, 404);
            responder($act);
        }

        if (!empty($_GET['historial'])) {
            if ($rol !== 'admin') responder('Solo admins.', false, 403);
            $stmt = $pdo->query(
                "SELECT h.*, a.nombre AS actividad_nombre
                   FROM actividades_historial h
                   LEFT JOIN actividades a ON a.id = h.actividad_id
                  ORDER BY h.fecha DESC LIMIT 200"
            );
            responder($stmt->fetchAll());
        }

        $where = []; $params = [];

        if (!$rol) {
            $where[] = "a.estado IN ('pendiente','aprobada','actualizada')";
        } elseif ($rol === 'oficina') {
            $where[]  = "a.oficina_id = ?";
            $params[] = $userId;
        }

        if (!empty($_GET['estado']))      { $where[] = "a.estado = ?";        $params[] = $_GET['estado']; }
        if (!empty($_GET['tipo']))         { $where[] = "a.tipo = ?";          $params[] = $_GET['tipo']; }
        if (!empty($_GET['fecha_inicio'])) { $where[] = "a.fecha_inicio >= ?"; $params[] = $_GET['fecha_inicio']; }
        if (!empty($_GET['fecha_fin']))    { $where[] = "a.fecha_fin <= ?";    $params[] = $_GET['fecha_fin']; }
        if (!empty($_GET['oficina_id']) && $rol === 'admin') {
            $where[] = "a.oficina_id = ?"; $params[] = (int)$_GET['oficina_id'];
        }

        $sql = "SELECT a.id, a.nombre, a.descripcion, a.fecha_inicio, a.fecha_fin,
                       a.hora_inicio, a.hora_fin, a.lugar, a.imagen, a.tipo,
                       a.es_repetitiva, a.estado, a.oficina_id, o.nombre AS oficina_nombre
                  FROM actividades a
                  JOIN oficinas o ON o.id = a.oficina_id";
        if ($where) $sql .= " WHERE " . implode(" AND ", $where);
        $sql .= " ORDER BY a.fecha_inicio ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        responder($stmt->fetchAll());

    } catch (PDOException $e) {
        responder('Error: ' . $e->getMessage(), false, 500);
    }
}

if ($metodo === 'POST') {
    if (!$rol) responder('Debe iniciar sesión.', false, 401);

    $d = leerJSON();
    requerir($d, 'nombre', 'fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin', 'lugar', 'tipo');

    $inicio    = new DateTime($d['fecha_inicio'] . ' ' . $d['hora_inicio']);
    $ahora     = new DateTime();
    $diferencia = $ahora->diff($inicio);
    $horasTotal = ($diferencia->days * 24) + $diferencia->h;

    if ($inicio <= $ahora || $horasTotal < 24) {
        responder('No se puede registrar con menos de 24 horas de anticipación.', false, 422);
    }

    if (!in_array($d['tipo'], ['Cultural', 'Academica', 'Ludica'])) {
        responder("Tipo inválido. Use: Cultural, Academica o Ludica.", false, 422);
    }

    $oficinaId = ($rol === 'admin') ? (int)($d['oficina_id'] ?? 0) : $userId;
    if (!$oficinaId) responder('oficina_id es obligatorio para admin.', false, 422);

    try {
        $pdo = conectar();
        $stmt = $pdo->prepare(
            "INSERT INTO actividades
               (nombre, descripcion, fecha_inicio, fecha_fin, hora_inicio, hora_fin,
                lugar, imagen, dependencia, tipo, es_repetitiva, estado, oficina_id)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
        );
        $stmt->execute([
            trim($d['nombre']), trim($d['descripcion'] ?? ''),
            $d['fecha_inicio'], $d['fecha_fin'], $d['hora_inicio'], $d['hora_fin'],
            trim($d['lugar']), $d['imagen'] ?? null, $d['dependencia'] ?? null,
            $d['tipo'], (int)($d['es_repetitiva'] ?? 0), 'pendiente', $oficinaId,
        ]);
        $newId = $pdo->lastInsertId();

        $pdo->prepare(
            "INSERT INTO actividades_historial (actividad_id, accion, datos_nuevos, realizado_por)
             VALUES (?, 'creacion', ?, ?)"
        )->execute([$newId, json_encode($d), $quien]);

        responder(['id' => $newId, 'mensaje' => 'Actividad creada.']);

    } catch (PDOException $e) {
        responder('Error: ' . $e->getMessage(), false, 500);
    }
}

if ($metodo === 'PUT') {
    if (!$rol) responder('Debe iniciar sesión.', false, 401);

    $id = (int)($_GET['id'] ?? 0);
    if (!$id) responder('ID inválido.', false, 422);
    $d = leerJSON();

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare("SELECT * FROM actividades WHERE id=?");
        $stmt->execute([$id]);
        $actual = $stmt->fetch();
        if (!$actual) responder('Actividad no encontrada.', false, 404);

        if ($rol === 'oficina' && $actual['oficina_id'] != $userId) {
            responder('No tiene permiso para editar esta actividad.', false, 403);
        }

        $nuevo = [
            'nombre'        => trim($d['nombre']        ?? $actual['nombre']),
            'descripcion'   => trim($d['descripcion']   ?? $actual['descripcion']),
            'fecha_inicio'  => $d['fecha_inicio']        ?? $actual['fecha_inicio'],
            'fecha_fin'     => $d['fecha_fin']            ?? $actual['fecha_fin'],
            'hora_inicio'   => $d['hora_inicio']          ?? $actual['hora_inicio'],
            'hora_fin'      => $d['hora_fin']              ?? $actual['hora_fin'],
            'lugar'         => trim($d['lugar']          ?? $actual['lugar']),
            'imagen'        => $d['imagen']               ?? $actual['imagen'],
            'dependencia'   => $d['dependencia']          ?? $actual['dependencia'],
            'tipo'          => $d['tipo']                 ?? $actual['tipo'],
            'es_repetitiva' => (int)($d['es_repetitiva'] ?? $actual['es_repetitiva']),
        ];

        $nuevoEstado = ($rol === 'admin' && isset($d['estado'])) ? $d['estado'] : 'actualizada';

        $pdo->prepare(
            "UPDATE actividades SET nombre=?, descripcion=?, fecha_inicio=?, fecha_fin=?,
               hora_inicio=?, hora_fin=?, lugar=?, imagen=?, dependencia=?,
               tipo=?, es_repetitiva=?, estado=? WHERE id=?"
        )->execute([
            $nuevo['nombre'], $nuevo['descripcion'], $nuevo['fecha_inicio'], $nuevo['fecha_fin'],
            $nuevo['hora_inicio'], $nuevo['hora_fin'], $nuevo['lugar'], $nuevo['imagen'],
            $nuevo['dependencia'], $nuevo['tipo'], $nuevo['es_repetitiva'], $nuevoEstado, $id,
        ]);

        $pdo->prepare(
            "INSERT INTO actividades_historial
               (actividad_id, accion, datos_anteriores, datos_nuevos, realizado_por)
             VALUES (?, 'actualizacion', ?, ?, ?)"
        )->execute([$id, json_encode($actual), json_encode($nuevo), $quien]);

        responder('Actividad actualizada.');

    } catch (PDOException $e) {
        responder('Error: ' . $e->getMessage(), false, 500);
    }
}

if ($metodo === 'DELETE') {
    if (!$rol) responder('Debe iniciar sesión.', false, 401);

    $id = (int)($_GET['id'] ?? 0);
    if (!$id) responder('ID inválido.', false, 422);

    try {
        $pdo  = conectar();
        $stmt = $pdo->prepare("SELECT * FROM actividades WHERE id=?");
        $stmt->execute([$id]);
        $actual = $stmt->fetch();
        if (!$actual) responder('Actividad no encontrada.', false, 404);

        if ($rol === 'oficina') {
            if ($actual['oficina_id'] != $userId) {
                responder('No tiene permiso para eliminar esta actividad.', false, 403);
            }
            $inicio = new DateTime($actual['fecha_inicio'] . ' ' . $actual['hora_inicio']);
            $ahora  = new DateTime();
            $diff   = $ahora->diff($inicio);
            $horas  = ($diff->days * 24) + $diff->h;
            if ($inicio <= $ahora || $horas < 24) {
                responder('No se puede eliminar con menos de 24 horas de anticipación.', false, 422);
            }
        }

        $pdo->prepare(
            "INSERT INTO actividades_historial
               (actividad_id, accion, datos_anteriores, realizado_por)
             VALUES (?, 'eliminacion', ?, ?)"
        )->execute([$id, json_encode($actual), $quien]);

        $pdo->prepare("DELETE FROM actividades WHERE id=?")->execute([$id]);
        responder('Actividad eliminada.');

    } catch (PDOException $e) {
        responder('Error: ' . $e->getMessage(), false, 500);
    }
}

responder('Método no permitido.', false, 405);