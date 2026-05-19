using Application.DTOs;

namespace Application.Queries
{
    public class GetCanchaByIdQuery
    {
        public int Id { get; set; }
        public GetCanchaByIdQuery(int id) => Id = id;
    }
}
