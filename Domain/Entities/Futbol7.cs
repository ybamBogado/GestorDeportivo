namespace Domain.Entities
{
    public class Futbol7 : Cancha
    {
        public int CantJugadores { get; set; } = 7;
        public string NombreTipo { get; set; } = "Fútbol 7";

        public override int GetDuracionMaxima()
        {
            return 90; // Ejemplo: 90 minutos
        }
    }
}
