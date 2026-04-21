namespace ShebsonVPN.API.Models;

public class ReferralBonus
{
    public int Id { get; set; }
    public int ReferrerId { get; set; }
    public User Referrer { get; set; } = null!;
    public int ReferralUserId { get; set; }
    public User ReferralUser { get; set; } = null!;
    public int BonusDays { get; set; } = 30;
    public long BonusTrafficBytes { get; set; } = 150L * 1024 * 1024 * 1024;
    public DateTime AwardedAt { get; set; } = DateTime.UtcNow;
}
