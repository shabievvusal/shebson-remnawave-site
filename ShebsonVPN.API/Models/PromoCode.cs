namespace ShebsonVPN.API.Models;

public class PromoCode
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public PromoType Type { get; set; }
    public decimal Value { get; set; }
    public int MaxUses { get; set; } = 1;
    public int UsedCount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum PromoType { Percent, Fixed, Days }
