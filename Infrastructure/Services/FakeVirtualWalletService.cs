using System.Threading.Tasks;


namespace Infrastructure.Services
{
    public class FakeVirtualWalletService : IVirtualWalletService
    {
        /// <summary>
        /// Simulates an external wallet. Approves payment if Amount > 0 and returns true.
        /// In a real integration this would call the external API.
        /// </summary>
        public Task<bool> ProcessPaymentAsync(decimal amount)
        {
            // Simple simulated logic: approve if amount > 0
            var approved = amount > 0;
            return Task.FromResult(approved);
        }
    }
}
