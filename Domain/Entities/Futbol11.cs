namespace Domain.Entities
{
    public class Futbol11 : Cancha
    {
        public int CantJugadores { get; set; } = 11;
        public string NombreTipo { get; set; } = "Fútbol 11";

        public override int GetDuracionMaxima()
        {
            return 120; // Ejemplo: 120 minutos
        }
    }
}
