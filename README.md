
# ESCALONES — Aplicación móvil

ESCALONES es una Aplicacion desarrollada para una imprenta, librería y espacio de coworking con atención las 24 horas.

El proyecto surge con el objetivo de centralizar en un mismo sistema diferentes necesidades, especialmente de estudiantes y personas que trabajan o estudian fuera de sus hogares. La plataforma permite realizar pedidos de impresión, comprar productos de librería, realizar reservas y gestionar distintos servicios desde un mismo lugar.

## Descripción del proyecto

ESCALONES es una propuesta que integra una imprenta, una librería, un espacio de coworking y actividades recreativas en un establecimiento con atención las 24 horas.

El proyecto surge con el objetivo de centralizar diferentes necesidades de estudiantes y personas que trabajan o estudian fuera de sus hogares.

La aplicación móvil permite acceder a los principales servicios desde dispositivos iOS y Android, utilizando el mismo backend que la plataforma web.

**Lema del proyecto:** Estudiá. Imprimí. Jugá.

## Repositorios del proyecto

ESCALONES se encuentra organizado en dos repositorios independientes:

- **Aplicación web y backend:** https://github.com/pablonnovillo/Escalones
- **Aplicación móvil:** https://github.com/pablonnovillo/Escalones-Mobile

El repositorio web contiene el frontend desarrollado con React y Vite y el backend desarrollado con Laravel.

El repositorio móvil contiene la aplicación desarrollada con React Native y Expo.

Ambas plataformas comparten una API REST y una base de datos MySQL.

## Tecnologías utilizadas

### Aplicación móvil

- React Native 0.88.1
- React 19.3.0
- Expo SDK 58
- JavaScript
- React Navigation 7
- Expo Secure Store
- Expo Document Picker
- React Native WebView
- Expo Vector Icons

### Backend compartido

- PHP 8.2+
- Laravel 12
- API REST
- Autenticación mediante tokens
- MySQL
- Integración con Mercado Pago

## Funcionalidades implementadas

### 1. Inicio

- Presentación institucional de ESCALONES.
- Información general sobre el establecimiento.
- Presentación de los servicios disponibles.
- Preguntas frecuentes.
- Información de contacto.
- Formulario de consultas.
- Visualización de contenido multimedia.
- Acceso a la ubicación mediante Google Maps.

### 2. Servicios

La aplicación permite consultar y utilizar diferentes servicios de ESCALONES.

**Impresiones**

- Selección de archivos desde el dispositivo.
- Compatibilidad con PDF, JPG, JPEG y PNG.
- Validación de formatos y tamaños.
- Selección del tipo de papel.
- Selección de cantidad de copias.
- Ingreso de datos del cliente.
- Selección del método de entrega.
- Validación de los datos mediante Laravel.

**Coworking**

- Reserva de espacios de estudio y trabajo.
- Selección de fechas y horarios.
- Selección de cantidad de personas.
- Consulta de disponibilidad desde la API.
- Identificación de horarios disponibles y ocupados.
- Selección de consumos adicionales.
- Cálculo del importe total estimado.
- Cálculo de la seña correspondiente.

**Juegos recreativos**

- Reserva de actividades recreativas.
- Selección del juego.
- Selección de fecha y duración.
- Consulta de horarios disponibles.
- Validación de reservas mediante Laravel.

### 3. Tienda

- Consulta de productos desde la API REST.
- Visualización del catálogo.
- Consulta de categorías.
- Filtrado de productos.
- Visualización de precios.
- Identificación de productos sin stock.
- Carrito de compras.
- Incorporación y eliminación de productos.
- Modificación de cantidades.
- Cálculo del importe total del carrito.

### 4. Reservas

- Consulta de las reservas del usuario.
- Visualización de próximas reservas.
- Consulta de reservas pasadas.
- Visualización de reservas canceladas.
- Consulta del estado de cada reserva.
- Visualización de fechas, horarios y detalles.
- Actualización de información desde Laravel.
- Integración experimental con Mercado Pago.
- Consulta del estado de pago de una reserva.

### 5. Mi cuenta

- Registro de usuarios.
- Inicio de sesión.
- Recuperación de contraseña.
- Consulta de datos personales.
- Actualización de información de la cuenta.
- Consulta de información asociada al usuario.
- Cierre de sesión.

## Arquitectura técnica

ESCALONES utiliza una arquitectura cliente-servidor, donde la aplicación móvil se comunica con una API REST desarrollada en Laravel.

La arquitectura se divide en tres capas principales:

### Capa de presentación

Desarrollada con React Native y Expo.

Es responsable de mostrar las pantallas, recibir las interacciones del usuario y presentar los datos obtenidos desde el backend.

### Capa de lógica de negocio

Implementada mediante Laravel.

Centraliza la autenticación, validación de datos, gestión de productos, reservas, impresiones e integraciones externas.

### Capa de persistencia

Implementada mediante MySQL.

Almacena la información de usuarios, productos, pedidos, reservas y otros datos del sistema.

### Diagrama de arquitectura

```text
        ESCALONES WEB
         React + Vite
              |
              |
              v
         API REST
           Laravel
              ^
              |
              |
      ESCALONES MOBILE
      React Native + Expo
              |
              |
              v
         API REST
           Laravel
              |
              v
        Base de datos
           MySQL
```

Ambas aplicaciones utilizan el mismo backend y comparten la información almacenada en MySQL.

La comunicación se realiza mediante solicitudes HTTP y respuestas JSON.

## Autenticación y seguridad

La aplicación implementa autenticación mediante tokens proporcionados por Laravel.

El estado de autenticación se administra mediante `AuthContext.js`.

Para almacenar la información de sesión de manera segura en el dispositivo se utiliza **Expo Secure Store**.

Las solicitudes que requieren autenticación incluyen el token correspondiente en sus encabezados HTTP.

Las credenciales privadas de la base de datos y de los servicios externos deben permanecer exclusivamente en el backend.

## Estructura del proyecto

```text
Escalones-Mobile/
│
├── assets/
│   ├── android-icon-background.png
│   ├── android-icon-foreground.png
│   ├── android-icon-monochrome.png
│   ├── favicon.png
│   ├── icon.png
│   ├── logo1.png
│   ├── portada3.jpg
│   └── splash-icon.png
│
├── src/
│   ├── context/
│   │   └── AuthContext.js
│   │
│   └── pantallas/
│       ├── Inicio.js
│       ├── Servicios.js
│       ├── Tienda.js
│       ├── Reservas.js
│       └── Cuenta.js
│
├── .gitignore
├── App.js
├── app.json
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

### Organización del código

- `assets/`: imágenes, íconos y recursos gráficos.
- `src/pantallas/`: pantallas principales de la aplicación.
- `src/context/`: administración compartida del estado de autenticación.
- `App.js`: navegación principal.
- `index.js`: punto de entrada.
- `app.json`: configuración de Expo.
- `package.json`: dependencias y comandos disponibles.
- `package-lock.json`: versiones resueltas de las dependencias.
- `.gitignore`: exclusión de archivos temporales y privados.
- `README.md`: documentación del proyecto.

## Requisitos previos

Para ejecutar ESCALONES Mobile localmente se necesita:

- Node.js y npm.
- Visual Studio Code o un editor compatible.
- Expo Go instalado en un dispositivo compatible.
- Backend Laravel de ESCALONES.
- PHP y Composer para ejecutar Laravel.
- MySQL configurado y funcionando.
- Conexión de red entre el dispositivo y el servidor local.

Para probar las funcionalidades conectadas al backend, la computadora y el celular deben poder comunicarse a través de la red.

## Instalación y ejecución

### 1. Descargar la aplicación móvil

Acceder al repositorio:

https://github.com/pablonnovillo/Escalones-Mobile

Descargar el código mediante GitHub o clonar el repositorio:

```bash
git clone https://github.com/pablonnovillo/Escalones-Mobile.git
```

Abrir la carpeta del proyecto en Visual Studio Code.

### 2. Instalar las dependencias

Desde una terminal ubicada en la carpeta del proyecto:

```bash
npm install
```

Este comando instala las dependencias definidas en `package.json`.

### 3. Preparar el backend Laravel

El backend se encuentra en el repositorio:

https://github.com/pablonnovillo/Escalones

Dentro de la carpeta `escalone-api`.

Ingresar a esa carpeta e instalar sus dependencias:

```bash
composer install
```

Configurar el archivo `.env` utilizando como referencia `.env.example`.

Generar la clave de Laravel cuando corresponda:

```bash
php artisan key:generate
```

Configurar la conexión con MySQL y preparar la base de datos.

Para ejecutar las migraciones:

```bash
php artisan migrate
```

Si el proyecto dispone de datos iniciales necesarios:

```bash
php artisan db:seed
```

### 4. Iniciar Laravel

Desde `escalone-api`, ejecutar:

```bash
php artisan serve --host=0.0.0.0 --port=8001
```

El parámetro `0.0.0.0` permite que el servidor escuche conexiones de red, siempre que la configuración del equipo y del firewall lo autorice.

**Importante:** actualmente algunos archivos de Mobile utilizan el puerto 8000 y otros el 8001. Antes de realizar una prueba completa se deben configurar todas las direcciones para que coincidan con el puerto donde se ejecuta Laravel.

### 5. Configurar la dirección IP de la API

La versión académica utiliza direcciones IP de desarrollo local.

Actualmente estas direcciones se encuentran definidas en:

- `src/context/AuthContext.js`
- `src/pantallas/Inicio.js`
- `src/pantallas/Servicios.js`
- `src/pantallas/Reservas.js`
- `src/pantallas/Tienda.js`

En una computadora distinta, reemplazar la dirección IP por la IPv4 correspondiente al equipo que ejecuta Laravel.

Por ejemplo, si el servidor utiliza la IP `192.168.1.100` y el puerto `8001`, la dirección de la API será:

```text
http://192.168.1.100:8001/api
```

La dirección del ejemplo debe reemplazarse por la configuración real del entorno.

No utilizar `localhost` como dirección del backend cuando la aplicación se ejecuta en un celular físico, porque apuntaría al propio dispositivo.

### 6. Configurar las imágenes servidas por la web

Algunas imágenes de la aplicación móvil se obtienen desde el frontend web.

Para iniciar el servidor de Vite, ingresar a la carpeta `escalone` del repositorio web, instalar las dependencias y ejecutar:

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Por defecto, Vite utiliza habitualmente el puerto `5173`.

Las direcciones de imágenes utilizadas por Mobile deben apuntar a la IP del equipo que ejecuta Vite.

También es necesario verificar que los archivos de imágenes correspondientes se encuentren disponibles en el proyecto web.

### 7. Iniciar ESCALONES Mobile

Desde la carpeta `Escalones-Mobile`, ejecutar:

```bash
npx expo start
```

Expo mostrará un código QR para abrir la aplicación mediante Expo Go.

En Windows, si PowerShell bloquea la ejecución de `npx.ps1`, puede utilizarse:

```bash
npx.cmd expo start -c
```

Este comando inicia Expo y limpia la caché.

### 8. Abrir la aplicación

1. Instalar Expo Go en un dispositivo compatible.
2. Conectar el dispositivo y la computadora a la misma red.
3. Iniciar Expo desde la terminal.
4. Escanear el código QR.
5. Abrir ESCALONES Mobile.

Las funciones que dependen de Laravel requieren que el backend y MySQL estén en ejecución.

## Variables de entorno

La aplicación móvil no requiere publicar credenciales privadas para su instalación.

Actualmente la URL de la API se encuentra configurada directamente en los archivos JavaScript.

La centralización de estas direcciones mediante variables de entorno es una mejora prevista.

### Configuración del backend

El backend Laravel utiliza variables de entorno para configurar:

- El entorno de ejecución de Laravel.
- La conexión con MySQL.
- La clave de la aplicación.
- La autenticación.
- Los servicios de correo electrónico.
- Las credenciales privadas de Mercado Pago.

Los nombres exactos y los valores requeridos deben consultarse en el archivo `.env.example` del backend.

Por seguridad, los archivos `.env` que contienen credenciales reales no deben publicarse en GitHub.

**Importante:** las credenciales privadas de Mercado Pago, las claves de MySQL y otros secretos no deben incorporarse al código de React Native.

## Puertos utilizados

| Servicio | Puerto de desarrollo |
|---|---|
| React / Vite | 5173 |
| Laravel | 8000 o 8001, según configuración |
| MySQL | 3306 |
| Expo | Administrado por Expo |

Las direcciones y los puertos deben ajustarse al entorno donde se ejecuta el proyecto.

## Estado actual del desarrollo

ESCALONES Mobile se encuentra en desarrollo como proyecto académico.

La aplicación cuenta con navegación entre pantallas, autenticación, consulta de productos, gestión del carrito, formularios, validaciones y funcionalidades de reservas conectadas al backend.

La integración con Mercado Pago se encuentra en etapa de pruebas.

### Funcionalidades pendientes

- Completar el procesamiento y confirmación de pagos.
- Finalizar la confirmación de pedidos de impresión.
- Implementar el cierre completo de las compras desde el carrito.
- Realizar pruebas de instalación y funcionamiento en distintos dispositivos.
- Centralizar la configuración de las direcciones de la API.

## Buenas prácticas implementadas

- Separación de pantallas en archivos independientes.
- Uso de un contexto compartido de autenticación.
- Almacenamiento seguro de información de sesión mediante Expo Secure Store.
- Validación de formularios y datos ingresados.
- Gestión de errores de conexión.
- Comunicación con Laravel mediante una API REST.
- Separación entre frontend móvil y backend.
- Exclusión de archivos temporales y privados mediante `.gitignore`.
- Utilización de un archivo de dependencias y su correspondiente archivo de bloqueo.

## Mejoras futuras
(Estaran implementadas antes de Diciembre 2026)
- Centralizar la configuración de la API.
- Utilizar variables de entorno para configuraciones no sensibles.
- Extraer componentes reutilizables.
- Dividir pantallas extensas en módulos más pequeños.
- Organizar los servicios HTTP en archivos independientes.
- Finalizar los pagos mediante Mercado Pago.
- Completar la integración del proceso de impresiones.
- Finalizar el checkout de la tienda.
- Incorporar pruebas automatizadas.
- Mejorar las pruebas de compatibilidad con Android e iOS.
- Optimizar rendimiento, navegación y experiencia de usuario.
- Personalizar los íconos definitivos de la aplicación.
- Generar una APK instalable para Android mediante Expo EAS Build, sin depender de Expo Go.
- Preparar una versión instalable para iOS.
- Evaluar la publicación de la aplicación en Google Play y App Store.

## Proyecto académico

**Proyecto:** ESCALONES

**Carrera:** Analista de Sistemas

**Asignatura:** Seminario Final

**Institución:** Escuela Da Vinci

**Año:** 2026

**Autor:** Pablo Novillo

