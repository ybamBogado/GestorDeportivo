using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReservasSoftLockYCanchaConfigurable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LimiteHorario",
                table: "RESERVA");

            migrationBuilder.DropColumn(
                name: "LimiteReserva",
                table: "RESERVA");

            migrationBuilder.AddColumn<string>(
                name: "CodigoPagoExterno",
                table: "RESERVA",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaExpiracion",
                table: "RESERVA",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "MetodoPago",
                table: "RESERVA",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            // NOTA: CertificadoPdf y FotoPerfil ya existen en PERSONA (aplicados por UpdatePersonaModel).
            // No se agregan aquí para evitar duplicados.

            migrationBuilder.AddColumn<int>(
                name: "DuracionMaximaMinutos",
                table: "CANCHA",
                type: "int",
                nullable: false,
                defaultValue: 60);

            migrationBuilder.AddColumn<decimal>(
                name: "PrecioHora",
                table: "CANCHA",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 4500m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CodigoPagoExterno",
                table: "RESERVA");

            migrationBuilder.DropColumn(
                name: "FechaExpiracion",
                table: "RESERVA");

            migrationBuilder.DropColumn(
                name: "MetodoPago",
                table: "RESERVA");

            // NOTA: CertificadoPdf y FotoPerfil pertenecen a la migración UpdatePersonaModel, no se eliminan aquí.

            migrationBuilder.DropColumn(
                name: "DuracionMaximaMinutos",
                table: "CANCHA");

            migrationBuilder.DropColumn(
                name: "PrecioHora",
                table: "CANCHA");

            migrationBuilder.AddColumn<int>(
                name: "LimiteHorario",
                table: "RESERVA",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LimiteReserva",
                table: "RESERVA",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
