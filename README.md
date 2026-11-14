
# ESCALONES — Aplicación móvil

Aplicación móvil desarrollada como parte del proyecto ESCALONES para la materia Seminario Final de la carrera Analista de Sistemas de la Escuela Da Vinci.

## Descripción del proyecto

ESCALONES es una propuesta que integra una imprenta, una librería, un espacio de coworking y actividades recreativas en un establecimiento con atención las 24 horas.

La aplicación móvil permite acceder a los servicios desde un dispositivo iOS o Android y se conecta con el mismo backend utilizado por la plataforma web.

**Lema:** Estudiá. Imprimí. Jugá.

## Tecnologías utilizadas

- React Native 0.88.1
- React 19.3.0
- Expo SDK 58
- JavaScript
- React Navigation 7
- Expo Secure Store
- Expo Document Picker
- React Native WebView
- API REST desarrollada con Laravel
- Base de datos MySQL

## Funcionalidades implementadas

### Inicio
- Presentación institucional de ESCALONES.
- Información sobre los servicios.
- Preguntas frecuentes.
- Información de contacto.
- Formulario de consultas.
- Integración de contenido multimedia.

### Servicios
- Visualización de servicios.
- Selección de archivos para impresión.
- Validación de datos de impresión.
- Reserva de espacios de coworking.
- Reserva de actividades recreativas.
- Selección de fechas y horarios.
- Consulta de disponibilidad mediante Laravel.
- Identificación de horarios ocupados.
- Cálculo del importe estimado y la seña.

### Tienda
- Consulta de productos desde Laravel.
- Visualización de categorías.
- Filtrado de productos.
- Carrito de compras.
- Control de cantidades y stock disponible.

### Reservas
- Consulta del historial de reservas.
- Visualización de reservas próximas y pasadas.
- Consulta del estado de cada reserva.
- Visualización de detalles.
- Integración experimental con Mercado Pago.

### Mi cuenta
- Registro e inicio de sesión.
- Recuperación de contraseña.
- Gestión de datos del usuario.
- Consulta de información asociada a la cuenta.
- Cierre de sesión.

## Arquitectura

La aplicación utiliza una arquitectura cliente-servidor.

Aplicación móvil (React Native + Expo)
            |
            | HTTP / JSON
            v
       API REST Laravel
            |
            v
       Base de datos MySQL

El backend es compartido con la aplicación web de ESCALONES.

La autenticación utiliza tokens gestionados por Laravel. La aplicación almacena la sesión mediante Expo Secure Store.

## Estructura del proyecto

Escalones-Mobile/
|-- assets/
|-- src/
|   |-- context/
|   |   `-- AuthContext.js
|   `-- pantallas/
|       |-- Inicio.js
|       |-- Servicios.js
|       |-- Tienda.js
|       |-- Reservas.js
|       `-- Cuenta.js
|-- App.js
|-- app.json
|-- index.js
|-- package.json
|-- package-lock.json
|-- .gitignore
`-- README.md

## Requisitos previos

Para ejecutar la aplicación se necesita:

- Node.js y npm.
- Expo Go instalado en un celular compatible.
- Backend Laravel de ESCALONES instalado y funcionando.
- Base de datos MySQL configurada.
- Conexión de red entre el dispositivo móvil y el servidor local.

## Instalación

### 1. Obtener el proyecto

Descargar el repositorio de GitHub y abrir la carpeta `Escalones-Mobile` en Visual Studio Code.

### 2. Instalar dependencias

Abrir una terminal dentro de `Escalones-Mobile` y ejecutar:

```bash
npm install
```

### 3. Configurar el backend

El backend Laravel se encuentra en la carpeta `escalone-api` del repositorio principal.

Debe configurarse el archivo `.env` de Laravel con las credenciales locales correspondientes.

Iniciar MySQL y ejecutar Laravel desde su carpeta:

```bash
php artisan serve --host=0.0.0.0 --port=8001
```

La base de datos debe contar con las tablas y migraciones necesarias para las funcionalidades utilizadas.

### 4. Configurar las direcciones de conexión

Esta versión académica utiliza direcciones IP de desarrollo local.

Las direcciones de la API están definidas actualmente en los siguientes archivos:

- `src/context/AuthContext.js`
- `src/pantallas/Inicio.js`
- `src/pantallas/Servicios.js`
- `src/pantallas/Reservas.js`
- `src/pantallas/Tienda.js`

Antes de ejecutarla en otra computadora, reemplazar la IP local por la dirección IPv4 del equipo que ejecuta Laravel.

Revisar también el puerto configurado en cada archivo. Algunas pantallas utilizan el puerto 8000 y otras el 8001.

Para visualizar las imágenes servidas por el frontend web, iniciar también el servidor de desarrollo de React/Vite cuando corresponda.

El celular y la computadora deben estar conectados a la misma red local.

### 5. Ejecutar Expo

En la carpeta `Escalones-Mobile`, ejecutar:

```bash
npx expo start
```

Expo mostrará un código QR para abrir la aplicación desde Expo Go.

En Windows también puede utilizarse:

```bash
npx.cmd expo start -c
```

Este último comando permite iniciar Expo limpiando la caché.

## Variables de entorno

La aplicación móvil no debe contener contraseñas de MySQL ni credenciales privadas de Mercado Pago.

Los secretos y la configuración privada deben permanecer en el backend Laravel, mediante su archivo `.env`.

La dirección de la API utilizada en esta versión se encuentra configurada en los archivos JavaScript mencionados anteriormente.

No publicar archivos `.env` con credenciales.

## Estado de desarrollo

ESCALONES Mobile se encuentra en una etapa de implementación académica.

Las funcionalidades de navegación, autenticación, catálogo y reservas forman parte del desarrollo principal.

La integración de Mercado Pago se encuentra en pruebas y requiere completar la validación del proceso de pago.

La confirmación de pedidos de impresión y el cierre de compras de la tienda son funcionalidades pendientes de completar.

## Buenas prácticas implementadas

- Organización de pantallas dentro de `src/pantallas`.
- Contexto compartido para gestionar la autenticación.
- Almacenamiento seguro de la sesión.
- Validación de formularios.
- Comunicación con Laravel mediante API REST.
- Gestión de errores de conexión.
- Separación del backend y la aplicación móvil.

## Mejoras futuras

- Centralización de la configuración de API.
- Extracción de componentes reutilizables.
- División de pantallas extensas en módulos más pequeños.
- Finalización de pagos con Mercado Pago.
- Integración completa del proceso de impresiones.
- Finalización del checkout de la tienda.
- Pruebas adicionales en Android e iOS.
- Preparación para publicación en tiendas de aplicaciones.
- Generación de una APK instalable para Android mediante Expo EAS Build, que permita utilizar ESCALONES sin depender de Expo Go.
- Preparación de una versión instalable para iOS.

## Proyecto académico

**Proyecto:** ESCALONES

**Carrera:** Analista de Sistemas

**Materia:** Seminario Final

**Institución:** Escuela Da Vinci

**Año:** 2026
