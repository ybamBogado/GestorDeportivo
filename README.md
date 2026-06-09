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

Para Login con google

Abrir el archivo .env y completar con tus credenciales locales:

GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
DB_CONNECTION=Server=(localdb)\\MSSQLLocalDB;Database=MSUsersDb;Trusted_Connection=True;TrustServerCertificate=True
EMAILJS_SERVICE_ID=tu_service_id
EMAILJS_TEMPLATE_ID=tu_template_id
EMAILJS_PUBLIC_KEY=tu_public_key

---

## 💡 Resumen de Comandos Rápidos

Si ya instalaste las dependencias (`pnpm install`) en una sesión anterior, tu flujo de trabajo diario será:

* **Terminal 1 (Backend):** `cd Api` ➔ `dotnet run`
* **Terminal 2 (Frontend):** `cd Frontend` ➔ `pnpm dev`

## Vistas del proyecto

##Home
<img width="1917" height="954" alt="image" src="https://github.com/user-attachments/assets/b3f2f766-162c-4223-b981-3b554c31cc84" />

##incripciones 
<img width="1909" height="885" alt="image" src="https://github.com/user-attachments/assets/e096028a-be5c-4c3d-87ee-5fa79d1ee780" />

##Visualización de canchas disponibles
<img width="1899" height="945" alt="image" src="https://github.com/user-attachments/assets/cc2f910c-00fd-44ff-a644-e1c1d3b73d51" />

##Seleccion de canchas
<img width="1911" height="942" alt="image" src="https://github.com/user-attachments/assets/8e99a5c7-085b-4460-a184-21d6673d3c11" />

##Sección de pagos (igual para todas las operaciones)

Tarjeta

<img width="1909" height="936" alt="image" src="https://github.com/user-attachments/assets/2df9bcac-8d9b-4928-becc-6288a956bbe3" />

transferencia

<img width="1907" height="954" alt="image" src="https://github.com/user-attachments/assets/86d5b447-fec6-469c-af18-cfd8b2f1fbf6" />

Efectivo

<img width="1920" height="952" alt="image" src="https://github.com/user-attachments/assets/035141cc-ec10-451c-840b-6cac4d58c403" />


##Panel usuario
<img width="1917" height="947" alt="image" src="https://github.com/user-attachments/assets/3d97773d-d867-468f-a099-61cbacfaefb8" />


## Inicio de Sesion 
<img width="1702" height="493" alt="image" src="https://github.com/user-attachments/assets/fe6c16d3-5dc4-4609-8c73-4640560ccdd4" />


## Registro

<img width="1687" height="493" alt="image" src="https://github.com/user-attachments/assets/4bf38984-a4e9-4de8-8578-368342c6ee80" />

##Panel de Administrador

Gestion de usuarios
<img width="1913" height="963" alt="image" src="https://github.com/user-attachments/assets/7804fe4f-6000-4a22-9db6-0dea3cae65ec" />

Gestión de Equipos

<img width="1918" height="946" alt="image" src="https://github.com/user-attachments/assets/cee76da5-6767-4f04-9341-8499c175b2e4" />

Gestión de Canchas

<img width="1918" height="948" alt="image" src="https://github.com/user-attachments/assets/3e4dbd17-a0de-423b-91b7-b434021dc9c9" />

Gestión de Reservas

<img width="1909" height="953" alt="image" src="https://github.com/user-attachments/assets/8f4a7784-fc2f-40dc-96c8-dab289532e7d" />

Gestión de Pagos y Recibos

<img width="1916" height="945" alt="image" src="https://github.com/user-attachments/assets/39808a40-da41-4790-a68d-c0a97df7595a" />

Gestión de ligas

<img width="1916" height="952" alt="image" src="https://github.com/user-attachments/assets/b99ae2b8-be0c-4145-ae23-5d568bee60bf" />

Fixture y Partidos

<img width="1911" height="944" alt="image" src="https://github.com/user-attachments/assets/c3d48c5d-b0c3-45ed-810c-f01956d29757" />

Gestión de torneos

<img width="1917" height="941" alt="image" src="https://github.com/user-attachments/assets/91c17eb5-4e6f-468f-afa1-5c0b60ebe752" />

Gestión de Clases y entrenamientos

<img width="1920" height="950" alt="image" src="https://github.com/user-attachments/assets/6284640d-b62f-4790-bcea-97cbb6be03d4" />
<img width="1906" height="950" alt="image" src="https://github.com/user-attachments/assets/dfa88925-38c2-4f08-b5ec-e060f74e7980" />

Reportes

<img width="1913" height="957" alt="image" src="https://github.com/user-attachments/assets/e68464d6-60dd-452e-b393-95ed07fe1bbb" />

<img width="1915" height="955" alt="image" src="https://github.com/user-attachments/assets/a385335d-fb4d-412a-8089-1db0ffd0ed4c" />

<img width="1917" height="950" alt="image" src="https://github.com/user-attachments/assets/c264b7e3-2765-4f4e-b5a7-f3a2800960f3" />
