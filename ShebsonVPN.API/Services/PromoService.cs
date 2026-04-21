using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;
using ShebsonVPN.API.Models;

namespace ShebsonVPN.API.Services;

public record PromoResult(bool Valid, string? Error, PromoType? Type, decimal Discount, int BonusDays, decimal FinalPrice, int? PromoCodeId);

public class PromoService(AppDbContext db)
{
    public async Task<PromoResult> ValidateAsync(string code, decimal originalPrice)
    {
        var promo = await db.PromoCodes.FirstOrDefaultAsync(p => p.Code == code.ToUpper());
        if (promo is null) return new(false, "Промокод не найден", null, 0, 0, originalPrice, null);
        if (!promo.IsActive) return new(false, "Промокод неактивен", null, 0, 0, originalPrice, null);
        if (promo.ExpiresAt.HasValue && promo.ExpiresAt < DateTime.UtcNow)
            return new(false, "Промокод истёк", null, 0, 0, originalPrice, null);
        if (promo.UsedCount >= promo.MaxUses)
            return new(false, "Промокод уже использован", null, 0, 0, originalPrice, null);

        decimal discount = 0;
        int bonusDays = 0;
        decimal finalPrice = originalPrice;

        switch (promo.Type)
        {
            case PromoType.Percent:
                discount = Math.Round(originalPrice * promo.Value / 100, 2);
                finalPrice = originalPrice - discount;
                break;
            case PromoType.Fixed:
                discount = Math.Min(promo.Value, originalPrice);
                finalPrice = originalPrice - discount;
                break;
            case PromoType.Days:
                bonusDays = (int)promo.Value;
                break;
        }

        return new(true, null, promo.Type, discount, bonusDays, finalPrice, promo.Id);
    }

    public async Task ApplyAsync(int promoCodeId)
    {
        await db.PromoCodes
            .Where(p => p.Id == promoCodeId)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.UsedCount, p => p.UsedCount + 1));
    }
}
