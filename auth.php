<?php
require_once __DIR__ . '/../conexion.php';

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    if (!empty($_SESSION['usuario'])) {
        responder(['rol' => $_SESSION['rol'], 'usuario' => $_SESSION['usuario'],
                   'id'  => $_SESSION['id'],  'nombre'  => $_SESSION['nombre'] ?? '']);
    }
    responder('No hay sesión activa.', false, 401);
}

if ($metodo === 'POST') {
    $datos = leerJSON();
    requerir($datos, 'usuario', 'contrasena');

    try {
        $pdo = conectar();

        $stmt = $pdo->prepare(
            "SELECT id, usuario FROM admins
              WHERE usuario = ? AND contrasena = SHA2(?,256) LIMIT 1"
        );
        $stmt->execute([$datos['usuario'], $datos['contrasena']]);
        $admin = $stmt->fetch();

        if ($admin) {
            $_SESSION['rol']     = 'admin';
            $_SESSION['usuario'] = $admin['usuario'];
            $_SESSION['id']      = $admin['id'];
            responder(['rol' => 'admin', 'usuario' => $admin['usuario']]);
        }

        $stmt = $pdo->prepare(
            "SELECT id, nombre, correo FROM oficinas
              WHERE correo = ? AND contrasena = SHA2(?,256)
                AND estado = 'activo' LIMIT 1"
        );
        $stmt->execute([$datos['usuario'], $datos['contrasena']]);
        $oficina = $stmt->fetch();

        if ($oficina) {
            $_SESSION['rol']     = 'oficina';
            $_SESSION['usuario'] = $oficina['correo'];
            $_SESSION['id']      = $oficina['id'];
            $_SESSION['nombre']  = $oficina['nombre'];
            responder(['rol' => 'oficina', 'usuario' => $oficina['correo'],
                       'nombre' => $oficina['nombre']]);
        }

        responder('Usuario o contraseña incorrectos.', false, 401);

    } catch (PDOException $e) {
        responder('Error de base de datos: ' . $e->getMessage(), false, 500);
    }
}

if ($metodo === 'DELETE') {
    session_destroy();
    responder('Sesión cerrada.');
}

responder('Método no permitido.', false, 405);