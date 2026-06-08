using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace Api.Controllers
{
    /// <summary>
    /// Gestión de Descuentos del Club.
    /// 
    /// RBAC:
    ///   - ADMINISTRADOR: Puede crear, activar y desactivar descuentos.
    ///   - EMPLEADO:      Solo puede consultar descuentos activos para aplicarlos al cobrar.
    ///   - USUARIO:       Sin acceso directo (aplica códigos en el checkout).
    /// </summary>
    [Route("api/v1/descuentos")]
    [ApiController]
    public class DescuentosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DescuentosController(AppDbContext context)
        {
            _context = context;
        }

        // ── GET /api/v1/descuentos ────────────────────────────────────────────
        /// <summary>
        /// Lista todos los descuentos configurados.
        /// El Empleado ve los activos para aplicarlos al atender en mostrador.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] bool? soloActivos)
        {
            var query = _context.Descuentos.AsQueryable();

            if (soloActivos == true)
                query = query.Where(d => d.Activo);

            var descuentos = await query
                .OrderByDescending(d => d.Activo)
                .ThenBy(d => d.Nombre)
                .Select(d => new
                {
                    d.Id,
                    d.Nombre,
                    d.Porcentaje,
                    d.TipoServicio,
                    d.Condicion,
                    d.CodigoPromocional,
                    d.Activo
                })
                .ToListAsync();

            return Ok(descuentos);
        }

        // ── GET /api/v1/descuentos/{id} ───────────────────────────────────────
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var d = await _context.Descuentos.FindAsync(id);
            if (d == null) return NotFound("Descuento no encontrado.");
            return Ok(d);
        }

        // ── POST /api/v1/descuentos ───────────────────────────────────────────
        /// <summary>
        /// Crea un nuevo descuento. Solo el Administrador debe poder acceder.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateDescuentoRequest request)
        {
            if (request.Porcentaje <= 0 || request.Porcentaje > 100)
                return BadRequest("El porcentaje debe estar entre 1 y 100.");

            if (string.IsNullOrWhiteSpace(request.Nombre))
                return BadRequest("El nombre del descuento es obligatorio.");

            var descuento = new Descuento
            {
                Nombre             = request.Nombre.Trim(),
                Porcentaje         = request.Porcentaje,
                TipoServicio       = request.TipoServicio ?? "General",
                Condicion          = request.Condicion?.Trim() ?? string.Empty,
                CodigoPromocional  = request.CodigoPromocional?.Trim().ToUpperInvariant() ?? string.Empty,
                Activo             = true
            };

            _context.Descuentos.Add(descuento);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = descuento.Id }, new
            {
                mensaje = $"✅ Descuento '{descuento.Nombre}' ({descuento.Porcentaje}%) creado.",
                id = descuento.Id
            });
        }

        // ── PUT /api/v1/descuentos/{id}/toggle ────────────────────────────────
        /// <summary>
        /// Activa o desactiva un descuento existente.
        /// Solo el Administrador puede usar este endpoint.
        /// </summary>
        [HttpPut("{id}/toggle")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Toggle(int id)
        {
            var descuento = await _context.Descuentos.FindAsync(id);
            if (descuento == null) return NotFound("Descuento no encontrado.");

            descuento.Activo = !descuento.Activo;
            await _context.SaveChangesAsync();

            var estado = descuento.Activo ? "activado" : "desactivado";
            return Ok(new { mensaje = $"✅ Descuento '{descuento.Nombre}' {estado}.", activo = descuento.Activo });
        }

        // ── GET /api/v1/descuentos/validar-codigo ─────────────────────────────
        /// <summary>
        /// Valida un código promocional y retorna el porcentaje de descuento.
        /// El checkout del usuario lo usa para aplicar descuentos con código.
        /// </summary>
        [HttpGet("validar-codigo")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ValidarCodigo([FromQuery] string codigo)
        {
            if (string.IsNullOrWhiteSpace(codigo))
                return BadRequest("Debe ingresar un código.");

            var descuento = await _context.Descuentos
                .Where(d => d.Activo && d.CodigoPromocional == codigo.Trim().ToUpperInvariant())
                .FirstOrDefaultAsync();

            if (descuento == null)
                return NotFound("Código promocional inválido o no activo.");

            return Ok(new
            {
                descuento.Id,
                descuento.Nombre,
                descuento.Porcentaje,
                descuento.TipoServicio,
                mensaje = $"✅ Código válido: {descuento.Nombre} — {descuento.Porcentaje}% de descuento."
            });
        }
    }

    // ── Request DTO ───────────────────────────────────────────────────────────
    public class CreateDescuentoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public decimal Porcentaje { get; set; }
        public string? TipoServicio { get; set; }
        public string? Condicion { get; set; }
        public string? CodigoPromocional { get; set; }
    }
}
