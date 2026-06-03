using System;

namespace Api.Models
{
    public class ReciboRequest
    {
        public int CobroId { get; set; }
        public string? Numero { get; set; }
        public DateTime? FechaEmision { get; set; }
        public string? Datos { get; set; }
    }
}
