namespace ShebsonVPN.API.Models;

public class Payment
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int? SubscriptionId { get; set; }
    public Subscription? Subscription { get; set; }

    public string YookassaPaymentId { get; set; } = null!;
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public int DurationDays { get; set; }
    public long TrafficBytes { get; set; }

    public PaymentPurpose Purpose { get; set; } = PaymentPurpose.Subscription;
    public int? PromoCodeId { get; set; }
    public PromoCode? PromoCode { get; set; }
    public decimal OriginalAmount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
}

public enum PaymentStatus
{
    Pending,
    Succeeded,
    Canceled,
    Refunded
}

public enum PaymentPurpose { Subscription, Gift, Trial, AutoRenew }
