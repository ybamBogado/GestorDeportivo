namespace Domain.Entities
{
    public class Descuento
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string TipoServicio { get; set; } = string.Empty;
        public decimal Porcentaje { get; set; }
        public bool Activo { get; set; } = true;
        /// <summary>
        /// Condición legible del descuento (ej: "Equipos en liga regular", "Escuelas afiliadas").
        /// Solo el Administrador puede configurar este campo.
        /// </summary>
        public string Condicion { get; set; } = string.Empty;
        /// <summary>
        /// Código promocional que el usuario puede ingresar en el checkout.
        /// Si es vacío, el descuento es automático (apólicado por el Empleado).
        /// </summary>
        public string CodigoPromocional { get; set; } = string.Empty;
    }
}
