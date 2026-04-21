using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;
using ShebsonVPN.API.DTOs;
using ShebsonVPN.API.Services;

namespace ShebsonVPN.API.Controllers;

[ApiController]
[Route("api/referrals")]
[Authorize]
public class ReferralsController(AppDbContext db, IConfiguration config, ReferralService referralService) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return Unauthorized();

        if (string.IsNullOrEmpty(user.ReferralCode))
        {
            user.ReferralCode = await referralService.GenerateUniqueCodeAsync();
            await db.SaveChangesAsync();
        }

        var referralCode = user.ReferralCode;
        var baseUrl = config["AppBaseUrl"] ?? "https://my.shebsonremna.spb.ru";
        var referralLink = $"{baseUrl}/register?ref={referralCode}";

        var referrals = await db.Users.Where(u => u.ReferredById == userId).ToListAsync();
        var paidReferrals = await db.Payments
            .Where(p => referrals.Select(r => r.Id).Contains(p.UserId) && p.Status == Models.PaymentStatus.Succeeded)
            .Select(p => p.UserId).Distinct().CountAsync();

        var bonuses = await db.ReferralBonuses
            .Where(b => b.ReferrerId == userId)
            .SumAsync(b => (int?)b.BonusDays) ?? 0;

        return Ok(new ReferralStatsResponse(referralCode, referralLink, referrals.Count, paidReferrals, bonuses));
    }
}
