<?php
require_once __DIR__ . '/../conexion.php';

if (empty($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    responder('Acceso denegado.', false, 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') responder('Método no permitido.', false, 405);

try {
    $pdo  = conectar();
    $tipo = $_GET['tipo'] ?? 'actividades';

    if ($tipo === 'actividades') {
        $where = []; $params = [];

        if (!empty($_GET['estado']))          { $where[] = "a.estado = ?";             $params[] = $_GET['estado']; }
        if (!empty($_GET['tipo_actividad']))   { $where[] = "a.tipo = ?";              $params[] = $_GET['tipo_actividad']; }
        if (!empty($_GET['oficina']))          { $where[] = "o.nombre LIKE ?";         $params[] = '%'.$_GET['oficina'].'%'; }
        if (!empty($_GET['descripcion']))      { $where[] = "a.descripcion LIKE ?";    $params[] = '%'.$_GET['descripcion'].'%'; }
        if (!empty($_GET['fecha_inicio']))     { $where[] = "a.fecha_inicio >= ?";     $params[] = $_GET['fecha_inicio']; }
        if (!empty($_GET['fecha_fin']))        { $where[] = "a.fecha_fin <= ?";        $params[] = $_GET['fecha_fin']; }

        $sql = "SELECT a.id, a.nombre, a.descripcion, a.fecha_inicio, a.fecha_fin,
                       a.hora_inicio, a.hora_fin, a.lugar, a.tipo,
                       a.es_repetitiva, a.estado, a.dependencia, o.nombre AS responsable
                  FROM actividades a
                  JOIN oficinas o ON o.id = a.oficina_id";
        if ($where) $sql .= " WHERE " . implode(" AND ", $where);
        $sql .= " ORDER BY a.fecha_inicio";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        responder($stmt->fetchAll());
    }

    if ($tipo === 'historial') {
        $stmt = $pdo->query(
            "SELECT h.id, h.actividad_id, h.accion, h.datos_anteriores, h.datos_nuevos,
                    h.realizado_por, h.fecha, a.nombre AS actividad_nombre
               FROM actividades_historial h
               LEFT JOIN actividades a ON a.id = h.actividad_id
              ORDER BY h.fecha DESC LIMIT 500"
        );
        responder($stmt->fetchAll());
    }

    if ($tipo === 'oficina') {
        $id = (int)($_GET['oficina_id'] ?? 0);
        if (!$id) responder('oficina_id es obligatorio.', false, 422);
        $stmt = $pdo->prepare(
            "SELECT a.id, a.nombre, a.descripcion, a.fecha_inicio, a.fecha_fin,
                    a.hora_inicio, a.hora_fin, a.lugar, a.tipo, a.es_repetitiva, a.estado
               FROM actividades a WHERE a.oficina_id = ? ORDER BY a.fecha_inicio"
        );
        $stmt->execute([$id]);
        responder($stmt->fetchAll());
    }

    responder('Tipo de informe no reconocido.', false, 422);

} catch (PDOException $e) {
    responder('Error: ' . $e->getMessage(), false, 500);
}