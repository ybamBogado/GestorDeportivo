using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class SeatStatusDto
    {
        public Guid Id { get; set; }
        public int SectorId { get; set; }
        public int SeatNumber { get; set; }
        public string Status { get; set; } = string.Empty;
        public string RowIdentifier { get; set; } = string.Empty;
    }
}
