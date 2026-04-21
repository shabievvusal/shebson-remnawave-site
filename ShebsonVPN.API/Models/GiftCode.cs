namespace ShebsonVPN.API.Models;

public class GiftCode
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string PlanId { get; set; } = null!;
    public int BoughtByUserId { get; set; }
    public User BoughtByUser { get; set; } = null!;
    public int? RedeemedByUserId { get; set; }
    public User? RedeemedByUser { get; set; }
    public int? PaymentId { get; set; }
    public Payment? Payment { get; set; }
    public bool IsUsed { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RedeemedAt { get; set; }
}
