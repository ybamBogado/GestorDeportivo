using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using System.Linq;
using Domain.Entities;
using Infrastructure.Persistence;
using Api.Models;
using Infrastructure.Services;

namespace Api.Controllers
{
    [Route("api/v1/cobros")]
    [ApiController]
    public class CobrosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IVirtualWalletService _walletService;



        public CobrosController(AppDbContext context, IVirtualWalletService walletService)
        {
            _context = context;
            _walletService = walletService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            var query = _context.Cobros.Include(c => c.Recibos).AsQueryable();
            if (desde.HasValue) query = query.Where(c => c.Fecha >= desde.Value);
            if (hasta.HasValue) query = query.Where(c => c.Fecha <= hasta.Value);

            return Ok(await query.OrderByDescending(c => c.Fecha).ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var cobro = await _context.Cobros
                .Include(c => c.Reserva)
                .Include(c => c.Recibos)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cobro == null) return NotFound("Cobro no encontrado");
            return Ok(cobro);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CobroRequest request)
        {
            var montoFinal = Math.Max(0, request.Monto - request.Descuento);
            var cobro = new Cobro
            {
                ReservaId = request.ReservaId,
                Concepto = request.Concepto,
                Monto = request.Monto,
                Descuento = request.Descuento,
                MontoFinal = montoFinal,
                Estado = string.IsNullOrWhiteSpace(request.Estado) ? "Pendiente" : request.Estado,
                MetodoPago = request.MetodoPago,
                Fecha = DateTime.UtcNow
            };

            _context.Cobros.Add(cobro);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = cobro.Id }, cobro);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CobroRequest request)
        {
            var cobro = await _context.Cobros.FindAsync(id);
            if (cobro == null) return NotFound("Cobro no encontrado");

            cobro.ReservaId = request.ReservaId;
            cobro.Concepto = request.Concepto;
            cobro.Monto = request.Monto;
            cobro.Descuento = request.Descuento;
            cobro.MontoFinal = Math.Max(0, request.Monto - request.Descuento);
            cobro.Estado = string.IsNullOrWhiteSpace(request.Estado) ? cobro.Estado : request.Estado;
            cobro.MetodoPago = request.MetodoPago;

            await _context.SaveChangesAsync();
            return Ok(cobro);
        }

        [HttpPost("{id}/pagar")]
        public async Task<IActionResult> RegistrarPago(int id, [FromBody] PagoRequest request)
        {
            var cobro = await _context.Cobros.Include(c => c.Reserva).FirstOrDefaultAsync(c => c.Id == id);
            if (cobro == null) return NotFound("Cobro no encontrado");

            // Process payment through virtual wallet service
            var paymentApproved = await _walletService.ProcessPaymentAsync(request.Monto);
            cobro.Estado = paymentApproved ? "Pagado" : "Rechazado";
            cobro.MetodoPago = request.MetodoPago;

            if (paymentApproved && cobro.Reserva != null)
            {
                cobro.Reserva.Estado = "Confirmada";
                cobro.Reserva.Pago = true;
            }

            if (paymentApproved)
            {
                var recibo = new Recibo
                {
                    CobroId = cobro.Id,
                    Numero = $"REC-{DateTime.UtcNow:yyyyMMddHHmmss}-{cobro.Id}",
                    FechaEmision = DateTime.UtcNow,
                    Datos = $"Recibo por {cobro.Concepto}. Monto final: {cobro.MontoFinal}"
                };
                _context.Recibos.Add(recibo);
            }

            await _context.SaveChangesAsync();
            return Ok(cobro);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cobro = await _context.Cobros.FindAsync(id);
            if (cobro == null) return NotFound("Cobro no encontrado");

            _context.Cobros.Remove(cobro);
            await _context.SaveChangesAsync();
            return Ok("Cobro eliminado");
        }


    }
}
