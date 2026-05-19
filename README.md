# ⚽ Gol Ahora - Sistema de Gestión de Canchas

Este proyecto incluye un Backend desarrollado en **.NET (C#)** y un Frontend moderno utilizando **React + Vite**. A continuación, se detallan los pasos necesarios para descargar y ejecutar el proyecto localmente.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:

1. [**Node.js**](https://nodejs.org/) (versión 18 o superior).
2. [**.NET SDK**](https://dotnet.microsoft.com/download) (asegúrate de tener la versión requerida por el proyecto, ej. .NET 8).
3. **pnpm**: Utilizamos `pnpm` como gestor de paquetes para el frontend debido a su velocidad y eficiencia. Si no lo tienes instalado, abre una terminal cualquiera y ejecuta:

   ```bash
   npm install -g pnpm
   ```

---

## Instalación y Ejecución

Para correr el proyecto completo en tu entorno local, necesitarás abrir **dos terminales diferentes**: una para el Backend y otra para el Frontend.

### 1️⃣ Levantar el Backend (API)

Abre tu primera terminal en la raíz del proyecto y sigue estos pasos:

1. Entra a la carpeta de la API:
   ```bash
   cd Api
   ```
2. Ejecuta el proyecto (esto restaurará automáticamente los paquetes de NuGet si es la primera vez que lo corres):
   ```bash
   dotnet run
   ```
*Nota: El servidor Backend se iniciará y quedará escuchando en `http://localhost:5071` (o el puerto configurado).*

---

### 2️⃣ Levantar el Frontend (React)

Mientras la primera terminal sigue corriendo, abre una **nueva terminal** en la raíz del proyecto y sigue estos pasos:

1. Entra a la carpeta del frontend:
   ```bash
   cd Frontend
   ```
2. Instala todas las dependencias del proyecto utilizando `pnpm` (esto solo es necesario la primera vez o si se añaden nuevos paquetes):
   ```bash
   pnpm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```
*Nota: Vite iniciará el frontend y te mostrará una URL (generalmente `http://localhost:5173`) a la cual puedes entrar desde tu navegador web para ver la aplicación funcionando.*

---

## 💡 Resumen de Comandos Rápidos

Si ya instalaste las dependencias (`pnpm install`) en una sesión anterior, tu flujo de trabajo diario será:

* **Terminal 1 (Backend):** `cd Api` ➔ `dotnet run`
* **Terminal 2 (Frontend):** `cd Frontend` ➔ `pnpm dev`
