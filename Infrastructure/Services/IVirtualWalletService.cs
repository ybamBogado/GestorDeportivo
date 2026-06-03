using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public interface IVirtualWalletService
    {
        /// <summary>
        /// Simulates processing a payment of the given amount.
        /// Returns true if the payment is approved (amount > 0).
        /// </summary>
        Task<bool> ProcessPaymentAsync(decimal amount);
    }
}
