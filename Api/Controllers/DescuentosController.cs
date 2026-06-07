using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    /// <summary>
    /// RF-33: Gestión de descuentos configurables por tipo de servicio.
    /// </summary>
    [Route("api/v1/descuentos")]
    [ApiController]
    public class DescuentosController : ControllerBase
    {
        private readonly AppDbContext _context;
        public DescuentosController(AppDbContext context) => _context = context;

        // GET api/v1/descuentos
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool? soloActivos)
        {
            var query = _context.Descuentos.AsQueryable();
            if (soloActivos == true) query = query.Where(d => d.Activo);
            return Ok(await query.OrderBy(d => d.TipoServicio).ToListAsync());
        }

        // GET api/v1/descuentos/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var desc = await _context.Descuentos.FindAsync(id);
            if (desc == null) return NotFound("Descuento no encontrado");
            return Ok(desc);
        }

        // POST api/v1/descuentos
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DescuentoRequest req)
        {
            if (req.Porcentaje < 0 || req.Porcentaje > 100)
                return BadRequest("El porcentaje debe estar entre 0 y 100.");

            var descuento = new Descuento
            {
                Nombre       = req.Nombre,
                TipoServicio = req.TipoServicio,
                Porcentaje   = req.Porcentaje,
                Activo       = req.Activo
            };
            _context.Descuentos.Add(descuento);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = descuento.Id }, descuento);
        }

        // PUT api/v1/descuentos/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DescuentoRequest req)
        {
            var desc = await _context.Descuentos.FindAsync(id);
            if (desc == null) return NotFound("Descuento no encontrado");

            if (req.Porcentaje < 0 || req.Porcentaje > 100)
                return BadRequest("El porcentaje debe estar entre 0 y 100.");

            desc.Nombre       = req.Nombre;
            desc.TipoServicio = req.TipoServicio;
            desc.Porcentaje   = req.Porcentaje;
            desc.Activo       = req.Activo;

            await _context.SaveChangesAsync();
            return Ok(desc);
        }

        // DELETE api/v1/descuentos/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var desc = await _context.Descuentos.FindAsync(id);
            if (desc == null) return NotFound("Descuento no encontrado");

            // Soft-delete
            desc.Activo = false;
            await _context.SaveChangesAsync();
            return Ok("Descuento desactivado.");
        }

        /// <summary>
        /// Calcula el monto final aplicando el descuento activo para un tipo de servicio.
        /// </summary>
        [HttpGet("calcular")]
        public async Task<IActionResult> Calcular([FromQuery] string tipoServicio, [FromQuery] decimal monto)
        {
            var descuento = await _context.Descuentos
                .Where(d => d.Activo && d.TipoServicio == tipoServicio)
                .OrderByDescending(d => d.Porcentaje)
                .FirstOrDefaultAsync();

            var porcentaje  = descuento?.Porcentaje ?? 0;
            var montoDescuento = monto * (porcentaje / 100m);
            var montoFinal     = monto - montoDescuento;

            return Ok(new
            {
                montoOriginal  = monto,
                porcentaje,
                montoDescuento,
                montoFinal,
                descuentoAplicado = descuento?.Nombre
            });
        }
    }

    public class DescuentoRequest
    {
        public string  Nombre       { get; set; } = string.Empty;
        public string  TipoServicio { get; set; } = string.Empty;
        public decimal Porcentaje   { get; set; }
        public bool    Activo       { get; set; } = true;
    }
}
