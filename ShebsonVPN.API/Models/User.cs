namespace ShebsonVPN.API.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? FirstName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsEmailVerified { get; set; }

    public string? ReferralCode { get; set; }
    public int? ReferredById { get; set; }
    public User? ReferredBy { get; set; }

    public bool IsAdmin { get; set; }
    public bool IsBanned { get; set; }

    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }

    public string? EmailVerificationToken { get; set; }

    public bool TrialUsed { get; set; }
    public bool AutoRenewEnabled { get; set; }
    public string? YookassaPaymentMethodId { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public ICollection<SupportTicket> Tickets { get; set; } = new List<SupportTicket>();
    public ICollection<ReferralBonus> ReferralBonusesGiven { get; set; } = new List<ReferralBonus>();
}
