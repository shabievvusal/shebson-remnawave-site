namespace ShebsonVPN.API.Models;

public class SentNotification
{
    public int Id { get; set; }
    public int SubscriptionId { get; set; }
    public Subscription Subscription { get; set; } = null!;
    public string NotificationType { get; set; } = null!;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
