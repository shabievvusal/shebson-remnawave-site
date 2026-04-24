using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;
using ShebsonVPN.API.DTOs;
using ShebsonVPN.API.Models;
using ShebsonVPN.API.Services;

namespace ShebsonVPN.API.Controllers;

[ApiController]
[Route("api/gifts")]
[Authorize]
public class GiftsController(AppDbContext db, YookassaService yoo, RemnawaveService remna, GiftService giftSvc) : ControllerBase
{
    private static readonly Dictionary<string, (int Days, long Traffic, int Devices)> PlanMeta = new()
    {
        ["month_1"]  = (30,  150L * 1024 * 1024 * 1024, 3),
        ["month_3"]  = (90,  500L * 1024 * 1024 * 1024, 5),
        ["month_12"] = (365, 1000L * 1024 * 1024 * 1024, 10),
    };

    private static readonly Dictionary<string, decimal> PlanPrices = new()
    {
        ["month_1"] = 150, ["month_3"] = 450, ["month_12"] = 1499,
    };

    [HttpPost("buy")]
    public async Task<ActionResult<BuyGiftResponse>> Buy(BuyGiftRequest req)
    {
        if (!PlanPrices.TryGetValue(req.PlanId, out var price))
            return BadRequest(new { error = "Тариф не найден" });

        var userId = GetUserId();
        if (!await IsEmailVerifiedAsync(userId))
            return BadRequest(new { error = "Подтвердите email перед покупкой подписки" });

        var payment = new Payment
        {
            UserId = userId,
            YookassaPaymentId = "",
            Amount = price,
            OriginalAmount = price,
            Status = PaymentStatus.Pending,
            Purpose = PaymentPurpose.Gift,
            DurationDays = PlanMeta[req.PlanId].Days,
            TrafficBytes = PlanMeta[req.PlanId].Traffic
        };
        db.Payments.Add(payment);
        await db.SaveChangesAsync();

        var gift = new GiftCode
        {
            Code = "PENDING",
            PlanId = req.PlanId,
            BoughtByUserId = userId,
            PaymentId = payment.Id,
            IsUsed = false
        };
        db.GiftCodes.Add(gift);
        await db.SaveChangesAsync();

        var result = await yoo.CreatePaymentAsync(price, $"Подарочная подписка ({req.PlanId})", payment.Id.ToString());
        payment.YookassaPaymentId = result.Id;
        await db.SaveChangesAsync();

        return Ok(new BuyGiftResponse(result.ConfirmationUrl, result.Id));
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var userId = GetUserId();
        var gifts = await db.GiftCodes
            .Include(g => g.Payment)
            .Where(g => g.BoughtByUserId == userId && g.Payment != null && g.Payment.Status == PaymentStatus.Succeeded)
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                g.Id, g.Code, g.PlanId, g.IsUsed, g.CreatedAt, g.RedeemedAt,
            })
            .ToListAsync();
        return Ok(gifts);
    }

    [HttpPost("redeem")]
    public async Task<ActionResult<RedeemGiftResponse>> Redeem(RedeemGiftRequest req)
    {
        var userId = GetUserId();
        var gift = await db.GiftCodes
            .Include(g => g.Payment)
            .FirstOrDefaultAsync(g => g.Code == req.Code.ToUpper() && !g.IsUsed);

        if (gift is null) return BadRequest(new { error = "Подарочный код не найден или уже использован" });
        if (gift.Payment?.Status != PaymentStatus.Succeeded)
            return BadRequest(new { error = "Подарок ещё не оплачен" });

        var user = await db.Users.FindAsync(userId)!;
        var meta = PlanMeta[gift.PlanId];

        var existingSub = await db.Subscriptions
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.ExpiresAt)
            .FirstOrDefaultAsync();

        Subscription sub;
        if (existingSub is not null)
        {
            await remna.RenewUserAsync(existingSub.RemnaUuid, meta.Days);
            existingSub.ExpiresAt = existingSub.ExpiresAt > DateTime.UtcNow
                ? existingSub.ExpiresAt.AddDays(meta.Days)
                : DateTime.UtcNow.AddDays(meta.Days);
            existingSub.Status = SubscriptionStatus.Active;
            sub = existingSub;
        }
        else
        {
            var remnaUser = await remna.CreateUserAsync(user!.Id, user.Email, meta.Days, meta.Traffic, meta.Devices);
            sub = new Subscription
            {
                UserId = userId,
                RemnaUuid = remnaUser.Uuid,
                RemnaShortUuid = remnaUser.ShortUuid,
                SubscriptionUrl = remnaUser.SubscriptionUrl,
                Status = SubscriptionStatus.Active,
                ExpiresAt = DateTime.UtcNow.AddDays(meta.Days),
                TrafficLimitBytes = meta.Traffic,
                DeviceLimit = meta.Devices
            };
            db.Subscriptions.Add(sub);
        }

        gift.IsUsed = true;
        gift.RedeemedByUserId = userId;
        gift.RedeemedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new RedeemGiftResponse(sub.Id, sub.ExpiresAt, sub.SubscriptionUrl));
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> IsEmailVerifiedAsync(int userId)
    {
        var user = await db.Users.FindAsync(userId);
        return user?.IsEmailVerified ?? false;
    }
}
