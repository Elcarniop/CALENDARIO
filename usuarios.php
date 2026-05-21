<?php
require_once __DIR__ . '/../conexion.php';

if (empty($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    responder('Acceso denegado.', false, 403);
}

$metodo = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = conectar();

    if ($metodo === 'GET') {
        $estado = $_GET['estado'] ?? null;
        if ($estado) {
            $stmt = $pdo->prepare(
                "SELECT id, nombre, tipo, jefe, correo, estado, created_at
                   FROM oficinas WHERE estado = ? ORDER BY nombre"
            );
            $stmt->execute([$estado]);
        } else {
            $stmt = $pdo->query(
                "SELECT id, nombre, tipo, jefe, correo, estado, created_at
                   FROM oficinas ORDER BY estado DESC, nombre"
            );
        }
        responder($stmt->fetchAll());
    }

    if ($metodo === 'POST') {
        $d = leerJSON();
        requerir($d, 'nombre', 'tipo', 'jefe', 'correo', 'contrasena');

        if (!in_array($d['tipo'], ['Academica', 'Administrativa'])) {
            responder("El tipo debe ser 'Academica' o 'Administrativa'.", false, 422);
        }

        $stmt = $pdo->prepare(
            "INSERT INTO oficinas (nombre, tipo, jefe, correo, contrasena)
             VALUES (?, ?, ?, ?, SHA2(?,256))"
        );
        $stmt->execute([trim($d['nombre']), $d['tipo'], trim($d['jefe']),
                        trim($d['correo']), $d['contrasena']]);
        responder(['id' => $pdo->lastInsertId(), 'mensaje' => 'Oficina creada correctamente.']);
    }

    if ($metodo === 'PUT') {
        $d  = leerJSON();
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) responder('ID inválido.', false, 422);

        if (isset($d['estado']) && count($d) === 1) {
            if (!in_array($d['estado'], ['activo', 'inactivo'])) {
                responder("Estado inválido.", false, 422);
            }
            $stmt = $pdo->prepare("UPDATE oficinas SET estado=? WHERE id=?");
            $stmt->execute([$d['estado'], $id]);
            responder('Estado actualizado.');
        }

        requerir($d, 'nombre', 'tipo', 'jefe', 'correo');
        $campos = "nombre=?, tipo=?, jefe=?, correo=?";
        $params = [trim($d['nombre']), $d['tipo'], trim($d['jefe']), trim($d['correo'])];

        if (!empty($d['contrasena'])) {
            $campos  .= ", contrasena=SHA2(?,256)";
            $params[] = $d['contrasena'];
        }
        $params[] = $id;
        $pdo->prepare("UPDATE oficinas SET $campos WHERE id=?")->execute($params);
        responder('Oficina actualizada correctamente.');
    }

    if ($metodo === 'DELETE') {
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) responder('ID inválido.', false, 422);
        $pdo->prepare("DELETE FROM oficinas WHERE id=?")->execute([$id]);
        responder('Oficina eliminada.');
    }

} catch (PDOException $e) {
    responder('Error de base de datos: ' . $e->getMessage(), false, 500);
}

responder('Método no permitido.', false, 405);