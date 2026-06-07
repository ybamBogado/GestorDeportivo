using Application.Commands;
using Application.Interfaces.Repositories;
using Domain.Entities;
using System;
using System.Globalization;
using System.Threading.Tasks;

namespace Application.Handlers
{
    public class CreateReservaCommandHandler
    {
        private readonly IReservaRepository _reservaRepository;
        private readonly IUnitOfWork        _unitOfWork;
        private readonly ICanchaRepository  _canchaRepository;

        public CreateReservaCommandHandler(
            IReservaRepository reservaRepository,
            IUnitOfWork        unitOfWork,
            ICanchaRepository  canchaRepository)
        {
            _reservaRepository = reservaRepository;
            _unitOfWork        = unitOfWork;
            _canchaRepository  = canchaRepository;
        }

        public async Task<int> HandleAsync(CreateReservaCommand command)
        {
            var horaInicio = TimeSpan.ParseExact(command.HoraInicio, @"hh\:mm", CultureInfo.InvariantCulture);
            var horaFin    = string.IsNullOrWhiteSpace(command.HoraFin)
                ? horaInicio.Add(TimeSpan.FromHours(1))
                : TimeSpan.ParseExact(command.HoraFin, @"hh\:mm", CultureInfo.InvariantCulture);

            // ── RF-15: Duración máxima según tipo de cancha ────────────────────
            var cancha = await _canchaRepository.GetByIdAsync(command.CanchaId)
                ?? throw new InvalidOperationException("Cancha no encontrada.");

            var duracionMinutos = (horaFin - horaInicio).TotalMinutes;
            if (duracionMinutos <= 0)
                throw new InvalidOperationException("La hora de fin debe ser posterior a la hora de inicio.");

            var maxDuracion = cancha.GetDuracionMaxima();
            if (duracionMinutos > maxDuracion)
                throw new InvalidOperationException(
                    $"La duración solicitada ({(int)duracionMinutos} min) supera el máximo permitido para esta cancha ({maxDuracion} min).");

            // ── RF-16: No se puede reservar con más de 30 días de anticipación ─
            var diasAntelacion = (command.Fecha.Date - DateTime.UtcNow.Date).TotalDays;
            if (diasAntelacion > 30)
                throw new InvalidOperationException("No se pueden realizar reservas con más de 30 días de anticipación.");
            if (diasAntelacion < 0)
                throw new InvalidOperationException("No se pueden realizar reservas para fechas pasadas.");

            // ── RF-12: Verificar disponibilidad (sin solapamientos ni bloqueos) ─
            var disponible = await _reservaRepository.IsAvailableAsync(
                command.CanchaId, command.Fecha, horaInicio, horaFin);
            if (!disponible)
                throw new InvalidOperationException(
                    "La cancha no está disponible en el horario solicitado. Verificá los bloqueos o reservas existentes.");

            var reserva = new Reserva
            {
                CanchaId      = command.CanchaId,
                PersonaId     = command.PersonaId,
                Fecha         = command.Fecha.Date,
                HoraInicio    = horaInicio,
                HoraFin       = horaFin,
                Precio        = command.Precio <= 0 ? 4500 : command.Precio,
                Estado        = "Pendiente",
                Pago          = command.Pago,
                LimiteReserva = 1,
                LimiteHorario = 1
            };

            await _reservaRepository.AddAsync(reserva);
            await _unitOfWork.SaveChangesAsync();

            return reserva.Id;
        }
    }
}
