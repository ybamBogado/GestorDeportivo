using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePersonaModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AUDIT_LOG_USER_UserId",
                table: "AUDIT_LOG");

            migrationBuilder.DropTable(
                name: "RESERVATION");

            migrationBuilder.DropTable(
                name: "SEAT");

            migrationBuilder.DropTable(
                name: "USER");

            migrationBuilder.DropTable(
                name: "SECTOR");

            migrationBuilder.DropTable(
                name: "EVENT");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "AUDIT_LOG",
                newName: "PersonaId");

            migrationBuilder.RenameIndex(
                name: "IX_AUDIT_LOG_UserId",
                table: "AUDIT_LOG",
                newName: "IX_AUDIT_LOG_PersonaId");

            migrationBuilder.CreateTable(
                name: "COMPLEJO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMPLEJO", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DESCUENTO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoServicio = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Porcentaje = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DESCUENTO", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "REPORTE",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaGeneracion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Periodo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Contenido = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Formato = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REPORTE", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CANCHA",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Superficie = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Capacidad = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ComplejoId = table.Column<int>(type: "int", nullable: true),
                    Discriminator = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    CantJugadores = table.Column<int>(type: "int", nullable: true),
                    NombreTipo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Futbol5_CantJugadores = table.Column<int>(type: "int", nullable: true),
                    Futbol5_NombreTipo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Futbol7_CantJugadores = table.Column<int>(type: "int", nullable: true),
                    Futbol7_NombreTipo = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CANCHA", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CANCHA_COMPLEJO_ComplejoId",
                        column: x => x.ComplejoId,
                        principalTable: "COMPLEJO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LIGA",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Reglamento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CupoEquipos = table.Column<int>(type: "int", nullable: false),
                    ComplejoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LIGA", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LIGA_COMPLEJO_ComplejoId",
                        column: x => x.ComplejoId,
                        principalTable: "COMPLEJO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PERSONA",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Apellido = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Dni = table.Column<int>(type: "int", nullable: false),
                    Legajo = table.Column<int>(type: "int", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ComplejoId = table.Column<int>(type: "int", nullable: true),
                    Discriminator = table.Column<string>(type: "nvarchar(13)", maxLength: 13, nullable: false),
                    IdAdministrador = table.Column<int>(type: "int", nullable: true),
                    Area = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Turno = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Certificado = table.Column<bool>(type: "bit", nullable: true),
                    FechaVencimientoCertificacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Certificacion = table.Column<bool>(type: "bit", nullable: true),
                    Profesor_FechaVencimientoCertificacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PERSONA", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PERSONA_COMPLEJO_ComplejoId",
                        column: x => x.ComplejoId,
                        principalTable: "COMPLEJO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TORNEO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Reglamento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Formato = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CupoEquipos = table.Column<int>(type: "int", nullable: false),
                    ComplejoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TORNEO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TORNEO_COMPLEJO_ComplejoId",
                        column: x => x.ComplejoId,
                        principalTable: "COMPLEJO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CANCHA_BLOQUEO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CanchaId = table.Column<int>(type: "int", nullable: false),
                    FechaHoraInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaHoraFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Motivo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CANCHA_BLOQUEO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CANCHA_BLOQUEO_CANCHA_CanchaId",
                        column: x => x.CanchaId,
                        principalTable: "CANCHA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CANCHA_REPORTE",
                columns: table => new
                {
                    CanchasId = table.Column<int>(type: "int", nullable: false),
                    ReportesId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CANCHA_REPORTE", x => new { x.CanchasId, x.ReportesId });
                    table.ForeignKey(
                        name: "FK_CANCHA_REPORTE_CANCHA_CanchasId",
                        column: x => x.CanchasId,
                        principalTable: "CANCHA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CANCHA_REPORTE_REPORTE_ReportesId",
                        column: x => x.ReportesId,
                        principalTable: "REPORTE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CLASE",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CanchaId = table.Column<int>(type: "int", nullable: false),
                    ProfesorId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaHora = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CapacidadMax = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ComplejoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CLASE", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CLASE_CANCHA_CanchaId",
                        column: x => x.CanchaId,
                        principalTable: "CANCHA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CLASE_COMPLEJO_ComplejoId",
                        column: x => x.ComplejoId,
                        principalTable: "COMPLEJO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CLASE_PERSONA_ProfesorId",
                        column: x => x.ProfesorId,
                        principalTable: "PERSONA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ENTRENAMIENTO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Cronograma = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CanchaId = table.Column<int>(type: "int", nullable: false),
                    EntrenadorId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ENTRENAMIENTO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ENTRENAMIENTO_CANCHA_CanchaId",
                        column: x => x.CanchaId,
                        principalTable: "CANCHA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ENTRENAMIENTO_PERSONA_EntrenadorId",
                        column: x => x.EntrenadorId,
                        principalTable: "PERSONA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EQUIPO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CapitanId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EQUIPO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EQUIPO_PERSONA_CapitanId",
                        column: x => x.CapitanId,
                        principalTable: "PERSONA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RESERVA",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HoraInicio = table.Column<TimeSpan>(type: "time", nullable: false),
                    HoraFin = table.Column<TimeSpan>(type: "time", nullable: false),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ComplejoId = table.Column<int>(type: "int", nullable: true),
                    LimiteReserva = table.Column<int>(type: "int", nullable: false),
                    LimiteHorario = table.Column<int>(type: "int", nullable: false),
                    Pago = table.Column<bool>(type: "bit", nullable: false),
                    CanchaId = table.Column<int>(type: "int", nullable: false),
                    PersonaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RESERVA", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RESERVA_CANCHA_CanchaId",
                        column: x => x.CanchaId,
                        principalTable: "CANCHA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RESERVA_COMPLEJO_ComplejoId",
                        column: x => x.ComplejoId,
                        principalTable: "COMPLEJO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_RESERVA_PERSONA_PersonaId",
                        column: x => x.PersonaId,
                        principalTable: "PERSONA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ASISTENCIA",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClaseId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Presente = table.Column<bool>(type: "bit", nullable: false),
                    FechaRegistro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ASISTENCIA", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ASISTENCIA_CLASE_ClaseId",
                        column: x => x.ClaseId,
                        principalTable: "CLASE",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ASISTENCIA_PERSONA_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "PERSONA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ENTRENAMIENTO_ALUMNO",
                columns: table => new
                {
                    AlumnosId = table.Column<int>(type: "int", nullable: false),
                    EntrenamientoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ENTRENAMIENTO_ALUMNO", x => new { x.AlumnosId, x.EntrenamientoId });
                    table.ForeignKey(
                        name: "FK_ENTRENAMIENTO_ALUMNO_ENTRENAMIENTO_EntrenamientoId",
                        column: x => x.EntrenamientoId,
                        principalTable: "ENTRENAMIENTO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ENTRENAMIENTO_ALUMNO_PERSONA_AlumnosId",
                        column: x => x.AlumnosId,
                        principalTable: "PERSONA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EQUIPO_JUGADOR",
                columns: table => new
                {
                    EquipoId = table.Column<int>(type: "int", nullable: false),
                    JugadoresId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EQUIPO_JUGADOR", x => new { x.EquipoId, x.JugadoresId });
                    table.ForeignKey(
                        name: "FK_EQUIPO_JUGADOR_EQUIPO_EquipoId",
                        column: x => x.EquipoId,
                        principalTable: "EQUIPO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EQUIPO_JUGADOR_PERSONA_JugadoresId",
                        column: x => x.JugadoresId,
                        principalTable: "PERSONA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "INSCRIPCION_LIGA",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LigaId = table.Column<int>(type: "int", nullable: false),
                    EquipoId = table.Column<int>(type: "int", nullable: false),
                    FechaInscripcion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INSCRIPCION_LIGA", x => x.Id);
                    table.ForeignKey(
                        name: "FK_INSCRIPCION_LIGA_EQUIPO_EquipoId",
                        column: x => x.EquipoId,
                        principalTable: "EQUIPO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_INSCRIPCION_LIGA_LIGA_LigaId",
                        column: x => x.LigaId,
                        principalTable: "LIGA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "INSCRIPCION_TORNEO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TorneoId = table.Column<int>(type: "int", nullable: false),
                    EquipoId = table.Column<int>(type: "int", nullable: false),
                    FechaInscripcion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_INSCRIPCION_TORNEO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_INSCRIPCION_TORNEO_EQUIPO_EquipoId",
                        column: x => x.EquipoId,
                        principalTable: "EQUIPO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_INSCRIPCION_TORNEO_TORNEO_TorneoId",
                        column: x => x.TorneoId,
                        principalTable: "TORNEO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PARTIDO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LigaId = table.Column<int>(type: "int", nullable: true),
                    TorneoId = table.Column<int>(type: "int", nullable: true),
                    EquipoLocalId = table.Column<int>(type: "int", nullable: false),
                    EquipoVisitanteId = table.Column<int>(type: "int", nullable: false),
                    FechaHora = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GolesLocal = table.Column<int>(type: "int", nullable: true),
                    GolesVisitante = table.Column<int>(type: "int", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PARTIDO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PARTIDO_EQUIPO_EquipoLocalId",
                        column: x => x.EquipoLocalId,
                        principalTable: "EQUIPO",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PARTIDO_EQUIPO_EquipoVisitanteId",
                        column: x => x.EquipoVisitanteId,
                        principalTable: "EQUIPO",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PARTIDO_LIGA_LigaId",
                        column: x => x.LigaId,
                        principalTable: "LIGA",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PARTIDO_TORNEO_TorneoId",
                        column: x => x.TorneoId,
                        principalTable: "TORNEO",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "COBRO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReservaId = table.Column<int>(type: "int", nullable: true),
                    Concepto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Descuento = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MontoFinal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MetodoPago = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COBRO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_COBRO_RESERVA_ReservaId",
                        column: x => x.ReservaId,
                        principalTable: "RESERVA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RECIBO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CobroId = table.Column<int>(type: "int", nullable: false),
                    Numero = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaEmision = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Datos = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RECIBO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RECIBO_COBRO_CobroId",
                        column: x => x.CobroId,
                        principalTable: "COBRO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ASISTENCIA_ClaseId_UsuarioId",
                table: "ASISTENCIA",
                columns: new[] { "ClaseId", "UsuarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ASISTENCIA_UsuarioId",
                table: "ASISTENCIA",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_CANCHA_ComplejoId",
                table: "CANCHA",
                column: "ComplejoId");

            migrationBuilder.CreateIndex(
                name: "IX_CANCHA_BLOQUEO_CanchaId",
                table: "CANCHA_BLOQUEO",
                column: "CanchaId");

            migrationBuilder.CreateIndex(
                name: "IX_CANCHA_REPORTE_ReportesId",
                table: "CANCHA_REPORTE",
                column: "ReportesId");

            migrationBuilder.CreateIndex(
                name: "IX_CLASE_CanchaId",
                table: "CLASE",
                column: "CanchaId");

            migrationBuilder.CreateIndex(
                name: "IX_CLASE_ComplejoId",
                table: "CLASE",
                column: "ComplejoId");

            migrationBuilder.CreateIndex(
                name: "IX_CLASE_ProfesorId",
                table: "CLASE",
                column: "ProfesorId");

            migrationBuilder.CreateIndex(
                name: "IX_COBRO_ReservaId",
                table: "COBRO",
                column: "ReservaId",
                unique: true,
                filter: "[ReservaId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ENTRENAMIENTO_CanchaId",
                table: "ENTRENAMIENTO",
                column: "CanchaId");

            migrationBuilder.CreateIndex(
                name: "IX_ENTRENAMIENTO_EntrenadorId",
                table: "ENTRENAMIENTO",
                column: "EntrenadorId");

            migrationBuilder.CreateIndex(
                name: "IX_ENTRENAMIENTO_ALUMNO_EntrenamientoId",
                table: "ENTRENAMIENTO_ALUMNO",
                column: "EntrenamientoId");

            migrationBuilder.CreateIndex(
                name: "IX_EQUIPO_CapitanId",
                table: "EQUIPO",
                column: "CapitanId");

            migrationBuilder.CreateIndex(
                name: "IX_EQUIPO_JUGADOR_JugadoresId",
                table: "EQUIPO_JUGADOR",
                column: "JugadoresId");

            migrationBuilder.CreateIndex(
                name: "IX_INSCRIPCION_LIGA_EquipoId",
                table: "INSCRIPCION_LIGA",
                column: "EquipoId");

            migrationBuilder.CreateIndex(
                name: "IX_INSCRIPCION_LIGA_LigaId_EquipoId",
                table: "INSCRIPCION_LIGA",
                columns: new[] { "LigaId", "EquipoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_INSCRIPCION_TORNEO_EquipoId",
                table: "INSCRIPCION_TORNEO",
                column: "EquipoId");

            migrationBuilder.CreateIndex(
                name: "IX_INSCRIPCION_TORNEO_TorneoId_EquipoId",
                table: "INSCRIPCION_TORNEO",
                columns: new[] { "TorneoId", "EquipoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LIGA_ComplejoId",
                table: "LIGA",
                column: "ComplejoId");

            migrationBuilder.CreateIndex(
                name: "IX_PARTIDO_EquipoLocalId",
                table: "PARTIDO",
                column: "EquipoLocalId");

            migrationBuilder.CreateIndex(
                name: "IX_PARTIDO_EquipoVisitanteId",
                table: "PARTIDO",
                column: "EquipoVisitanteId");

            migrationBuilder.CreateIndex(
                name: "IX_PARTIDO_LigaId",
                table: "PARTIDO",
                column: "LigaId");

            migrationBuilder.CreateIndex(
                name: "IX_PARTIDO_TorneoId",
                table: "PARTIDO",
                column: "TorneoId");

            migrationBuilder.CreateIndex(
                name: "IX_PERSONA_ComplejoId",
                table: "PERSONA",
                column: "ComplejoId");

            migrationBuilder.CreateIndex(
                name: "IX_RECIBO_CobroId",
                table: "RECIBO",
                column: "CobroId");

            migrationBuilder.CreateIndex(
                name: "IX_RESERVA_CanchaId",
                table: "RESERVA",
                column: "CanchaId");

            migrationBuilder.CreateIndex(
                name: "IX_RESERVA_ComplejoId",
                table: "RESERVA",
                column: "ComplejoId");

            migrationBuilder.CreateIndex(
                name: "IX_RESERVA_PersonaId",
                table: "RESERVA",
                column: "PersonaId");

            migrationBuilder.CreateIndex(
                name: "IX_TORNEO_ComplejoId",
                table: "TORNEO",
                column: "ComplejoId");

            migrationBuilder.AddForeignKey(
                name: "FK_AUDIT_LOG_PERSONA_PersonaId",
                table: "AUDIT_LOG",
                column: "PersonaId",
                principalTable: "PERSONA",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AUDIT_LOG_PERSONA_PersonaId",
                table: "AUDIT_LOG");

            migrationBuilder.DropTable(
                name: "ASISTENCIA");

            migrationBuilder.DropTable(
                name: "CANCHA_BLOQUEO");

            migrationBuilder.DropTable(
                name: "CANCHA_REPORTE");

            migrationBuilder.DropTable(
                name: "DESCUENTO");

            migrationBuilder.DropTable(
                name: "ENTRENAMIENTO_ALUMNO");

            migrationBuilder.DropTable(
                name: "EQUIPO_JUGADOR");

            migrationBuilder.DropTable(
                name: "INSCRIPCION_LIGA");

            migrationBuilder.DropTable(
                name: "INSCRIPCION_TORNEO");

            migrationBuilder.DropTable(
                name: "PARTIDO");

            migrationBuilder.DropTable(
                name: "RECIBO");

            migrationBuilder.DropTable(
                name: "CLASE");

            migrationBuilder.DropTable(
                name: "REPORTE");

            migrationBuilder.DropTable(
                name: "ENTRENAMIENTO");

            migrationBuilder.DropTable(
                name: "EQUIPO");

            migrationBuilder.DropTable(
                name: "LIGA");

            migrationBuilder.DropTable(
                name: "TORNEO");

            migrationBuilder.DropTable(
                name: "COBRO");

            migrationBuilder.DropTable(
                name: "RESERVA");

            migrationBuilder.DropTable(
                name: "CANCHA");

            migrationBuilder.DropTable(
                name: "PERSONA");

            migrationBuilder.DropTable(
                name: "COMPLEJO");

            migrationBuilder.RenameColumn(
                name: "PersonaId",
                table: "AUDIT_LOG",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_AUDIT_LOG_PersonaId",
                table: "AUDIT_LOG",
                newName: "IX_AUDIT_LOG_UserId");

            migrationBuilder.CreateTable(
                name: "EVENT",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Venue = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EVENT", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "USER",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USER", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SECTOR",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventId = table.Column<int>(type: "int", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SECTOR", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SECTOR_EVENT_EventId",
                        column: x => x.EventId,
                        principalTable: "EVENT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SEAT",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SectorId = table.Column<int>(type: "int", nullable: false),
                    RowIdentifier = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SeatNumber = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Version = table.Column<int>(type: "int", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SEAT", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SEAT_SECTOR_SectorId",
                        column: x => x.SectorId,
                        principalTable: "SECTOR",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RESERVATION",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SeatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReservedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RESERVATION", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RESERVATION_SEAT_SeatId",
                        column: x => x.SeatId,
                        principalTable: "SEAT",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RESERVATION_USER_UserId",
                        column: x => x.UserId,
                        principalTable: "USER",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RESERVATION_SeatId",
                table: "RESERVATION",
                column: "SeatId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RESERVATION_UserId",
                table: "RESERVATION",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SEAT_SectorId",
                table: "SEAT",
                column: "SectorId");

            migrationBuilder.CreateIndex(
                name: "IX_SECTOR_EventId",
                table: "SECTOR",
                column: "EventId");

            migrationBuilder.AddForeignKey(
                name: "FK_AUDIT_LOG_USER_UserId",
                table: "AUDIT_LOG",
                column: "UserId",
                principalTable: "USER",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
