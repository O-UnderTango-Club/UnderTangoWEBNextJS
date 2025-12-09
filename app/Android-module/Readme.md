# UnderTango Web + Android-module

Este proyecto integra **UnderTango Web** con un módulo Android (`Android-module`) que permite vincular funcionalidades de la aplicación web con dispositivos Android, incluyendo notificaciones push y sincronización de datos.

---

## 🔹 Requisitos previos

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas:

- Node.js (v18 o superior)
- npm o yarn
- Firebase CLI (`firebase-tools`)
- Un proyecto de Firebase con **App Web**
- Certificados HTTPS si deseas probar notificaciones push
- Android Studio (para pruebas del módulo Android)

---

## 1️⃣ Instalar dependencias del proyecto

Ejecuta el comando de instalación dentro del directorio del proyecto:

```bash
cd C:\Undertango\UnderTangoWEBNextJS
npm install
# o con
yarn install
```
---

## 2️⃣ Instalar dependencias globales

Instala globalmente firebase-tools:

```bash
cd C:\Undertango\UnderTangoWEBNextJS
npm install -g firebase-tools
```

---

## 3️⃣ Configuración en Firebase

1. Crea un nuevo proyecto en Firebase o usa uno existente.

2. Asegúrate de que el proyecto tenga configurada una App Web.

3. Vincula tu proyecto local con Firebase:

```bash
cd C:\Undertango\UnderTangoWEBNextJS
firebase init
firebase login
```

Durante la inicialización, selecciona Hosting y vincula la App Web de tu proyecto.

---

## 4️⃣ Crear y configurar el archivo .env

En la raíz del proyecto, crea el archivo .env.local con las variables de Firebase:

- NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
- NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
- NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

Puedes usar example.env.txt como referencia.

---

## 5️⃣ Build del proyecto

Para generar la versión de producción:

```bash
npm run build
# o con yarn
yarn build
```

Luego ejecutamos el comando:

```bash
npm build-sw
```

---

## 6️⃣ Ejecutar el proyecto en local

```bash
npm start
# o con yarn
yarn start
```

Para desarrollo con hot reload:

```bash
npm run dev
# o con yarn
yarn dev
```

**IMPORTANTE:** Para probar notificaciones push, el servidor debe estar en HTTPS, ya que Firebase no permite enviar notificaciones a través de HTTP local porque lo considera no seguro.

---

## 7️⃣ Android-module

El módulo Android-module permite que la aplicación web se comunique con dispositivos Android para:

- Sincronización de datos en tiempo real

- Notificaciones push

- Funcionalidades nativas de Android

**Pasos importantes:**

1. Integra el módulo dentro del proyecto Android siguiendo la documentación del módulo.

2. Configura las credenciales de Firebase en la app web (google-services.json).

3. Asegúrate de que la comunicación con Firebase y la web sea correcta mediante HTTPS.

---

## 8️⃣ Recursos

[![Node.js](https://img.shields.io/badge/Node.js-v18.x-green)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=white)](https://firebase.google.com/docs/cli)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-v14.0.0-black?logo=next.js)](https://nextjs.org/)







