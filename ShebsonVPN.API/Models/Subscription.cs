namespace ShebsonVPN.API.Models;

public class Subscription
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string RemnaUuid { get; set; } = null!;
    public string RemnaShortUuid { get; set; } = null!;
    public string SubscriptionUrl { get; set; } = null!;

    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public long TrafficLimitBytes { get; set; }
    public int DeviceLimit { get; set; } = 3;

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public enum SubscriptionStatus
{
    Active,
    Expired,
    Suspended
}
