# Ticketinador 2000 

## Objetivo del Proyecto
Desarrollar una plataforma integral de venta de tickets. El foco principal fue crear una arquitectura escalable, mantenible y profesional en el backend, acompañada de una interfaz de usuario moderna y responsiva.

## Arquitectura y Tecnologías

### Backend (C# .NET 8)
- **Clean Architecture**: Estructura modular dividida en capas (Api, Application, Domain, Infrastructure) para separar responsabilidades.
- **Patrón Repository & Unit of Work**: Implementación de repositorios para desacoplar la lógica de negocio de la persistencia de datos. Esto facilita:
  - **Unit Testing**: Permite realizar pruebas sin necesidad de una base de datos real.
  - **Flexibilidad**: Facilita la migración a otros motores de base de datos sin afectar la lógica del programa.
  - **Atomicidad**: Uso de Unit of Work para garantizar transacciones seguras.
- **Patrón CQRS con Handlers**: Implementación de Command y Query Handlers para un procesamiento de peticiones desacoplado y eficiente.
- **Persistencia**: SQL Server gestionado con Entity Framework Core mediante migraciones.

### Frontend (React + Vite)
- **SPA (Single Page Application)**: Interfaz reactiva con navegación instantánea.
- **UX**: Diseño moderno con paleta de colores "Slate Blue" .
- **Manejo de Estados**: Gestión de sesión global mediante Context API (AuthContext).
- **Diseño Responsive**: Diseño adaptativo para móviles y escritorio con Bootstrap 5 y CSS3.

## Características Principales

### Gestión de Eventos y Reservas
- **Catálogo Dinámico**: Exploración de eventos consumidos desde una API REST.
  <img width="1900" height="936" alt="image" src="https://github.com/user-attachments/assets/78c79f94-b3f2-4692-aa56-2e81f7e1976a" />

- **Mapa de Asientos en Tiempo Real**: Visualización del estado de las butacas y sistema de reserva interactivo.
  <img width="1896" height="935" alt="image" src="https://github.com/user-attachments/assets/be47f20e-b6f0-4b3e-b463-1d47d6f97d3b" />

- **Autenticación de Usuarios**: Flujo de inicio de sesión gestionado con notificaciones dinámicas.
<img width="1911" height="952" alt="image" src="https://github.com/user-attachments/assets/72cd59fb-658a-475b-822a-b6fd35d36e0f" />


## Tecnologías Utilizadas
- **Backend**: C#, .NET 8, EF Core.
- **Base de Datos**: SQL Server.
- **Frontend**: React.js, Vite.
- **Estilos**: Bootstrap 5, CSS3 Custom Properties.
- **Control de Versiones**: Git.

# Guía de Instalación y Ejecución Local (Ticketinador2000)

Esta guía detalla los pasos necesarios para levantar todo el proyecto en un entorno local, tanto el backend (.NET) como el frontend (React + Vite).

---

##  Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu máquina:

1. **[.NET SDK](https://dotnet.microsoft.com/download)**: Requerido para compilar y ejecutar el backend.
2. **[Node.js](https://nodejs.org/)** (versión 18+ recomendada): Requerido para instalar las dependencias del frontend y ejecutar el servidor de Vite.
3. **SQL Server LocalDB**: Generalmente se instala junto con Visual Studio. El backend está configurado para conectarse a `(localdb)\MSSQLLocalDB`.

---

##  1. Configurar la Base de Datos

El proyecto utiliza Entity Framework Core y está programado para **crear la base de datos automáticamente** (junto con las tablas y datos iniciales) la primera vez que se ejecuta el Backend.

### Opciones de Motor:

- **Opción A (Por defecto - LocalDB):** Si tienes Visual Studio instalado, ya tienes LocalDB. **No tienes que hacer nada**. El proyecto se conectará a `(localdb)\MSSQLLocalDB` y creará la BD `Ticketinador2000Db`.
- **Opción B (SQL Server Express / Docker):** Si prefieres usar una instancia de SQL Server propia (por ejemplo, corriendo en Docker o SSMS), debes abrir el archivo `Api/appsettings.json` y modificar la cadena de conexión:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=Ticketinador2000Db;User Id=sa;Password=TuPassword123!;TrustServerCertificate=True;"
  }
  ```

---

##  2. Levantar el Backend (API REST)

El backend está construido con la arquitectura Clean Architecture. **No es necesario correr migraciones manualmente**, ya que la aplicación llamará a `EnsureCreated` y `DbInitializer` automáticamente al arrancar.

### Pasos:

1. Abre una terminal.
2. Navega al directorio del proyecto API:
   ```bash
   cd ruta/a/Ticketinador2000/Api
   ```
3. Ejecuta la aplicación:
   ```bash
   dotnet run
   ```
4. **¿Qué sucede al ejecutar?**
   - Se creará automáticamente la base de datos `Ticketinador2000Db` en tu LocalDB.
   - Se insertarán datos iniciales (Usuarios, Eventos, Sectores y Asientos).
   - La consola mostrará la URL donde se está ejecutando la API (por ejemplo, `https://localhost:7123` o similar).


> [!NOTE]
> La conexión a la base de datos está definida en `Api/appsettings.json`. Si no tienes LocalDB y usas SQL Server estándar, deberás cambiar la cadena de conexión allí.

---

##  3. Levantar el Frontend (Cliente Web)

El frontend es una aplicación React construida con Vite, la cual se comunica asíncronamente con nuestra API REST.

### Pasos:

1. Abre **otra** terminal (manteniendo la del backend abierta).
2. Navega al directorio del cliente web:
   ```bash
   cd ruta/a/Ticketinador2000/TicketingClient
   ```
3. Instala todas las dependencias necesarias de Node:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
5. La terminal te mostrará una URL local (generalmente `http://localhost:5173/`). Haz ctrl+clic o abre esa URL en tu navegador para usar la aplicación.




## Colaboradores
- [Benjamin Dure](https://github.com/beduch)
- [Ivan Bogado](https://github.com/ybamBogado)
