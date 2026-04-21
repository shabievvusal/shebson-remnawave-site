using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;
using ShebsonVPN.API.Models;

namespace ShebsonVPN.API.Services;

public class ReferralService(AppDbContext db, RemnawaveService remna)
{
    private const string Chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public async Task<string> GenerateUniqueCodeAsync()
    {
        while (true)
        {
            var code = new string(Enumerable.Range(0, 8).Select(_ => Chars[RandomNumberGenerator.GetInt32(Chars.Length)]).ToArray());
            if (!await db.Users.AnyAsync(u => u.ReferralCode == code))
                return code;
        }
    }

    public async Task AwardBonusAsync(int referrerId, int referralUserId)
    {
        var alreadyAwarded = await db.ReferralBonuses.AnyAsync(r => r.ReferralUserId == referralUserId);
        if (alreadyAwarded) return;

        var referrerSub = await db.Subscriptions
            .Where(s => s.UserId == referrerId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.ExpiresAt)
            .FirstOrDefaultAsync();

        if (referrerSub is null) return;

        const int bonusDays = 30;
        const long bonusTrafficBytes = 150L * 1024 * 1024 * 1024;
        await remna.RenewUserAsync(referrerSub.RemnaUuid, bonusDays, bonusTrafficBytes);
        referrerSub.ExpiresAt = referrerSub.ExpiresAt > DateTime.UtcNow
            ? referrerSub.ExpiresAt.AddDays(bonusDays)
            : DateTime.UtcNow.AddDays(bonusDays);

        db.ReferralBonuses.Add(new ReferralBonus
        {
            ReferrerId = referrerId,
            ReferralUserId = referralUserId,
            BonusDays = bonusDays,
            BonusTrafficBytes = bonusTrafficBytes
        });

        await db.SaveChangesAsync();
    }
}
