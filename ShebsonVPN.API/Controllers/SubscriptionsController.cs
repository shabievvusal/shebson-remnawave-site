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
[Route("api/subscriptions")]
[Authorize]
public class SubscriptionsController(
    AppDbContext db, RemnawaveService remna, YookassaService yoo,
    PromoService promo, ReferralService referral) : ControllerBase
{
    private static readonly List<PlanDto> Plans =
    [
        new("month_1", "1 месяц", 150, 30, 150L * 1024 * 1024 * 1024, 3, "150 ГБ трафика"),
        new("month_3", "3 месяца", 399, 90, 300L * 1024 * 1024 * 1024, 5, "300 ГБ трафика"),
        new("month_12", "12 месяцев", 1499, 365, 1000L * 1024 * 1024 * 1024, 10, "1 ТБ трафика"),
    ];

    [HttpGet("plans")]
    [AllowAnonymous]
    public IActionResult GetPlans() => Ok(Plans);

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var userId = GetUserId();
        var subs = await db.Subscriptions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var results = await Task.WhenAll(subs.Select(async s =>
        {
            var (exists, usedBytes) = await remna.GetUserInfoAsync(s.RemnaUuid);
            if (!exists) return null;
            return new SubscriptionDto(
                s.Id, s.Status.ToString(), s.ExpiresAt,
                s.TrafficLimitBytes, s.DeviceLimit,
                s.SubscriptionUrl, s.RemnaShortUuid, usedBytes);
        }));

        return Ok(results.Where(r => r is not null));
    }

    [HttpGet("trial-status")]
    public async Task<IActionResult> TrialStatus()
    {
        var userId = GetUserId();
        var user = await db.Users.FindAsync(userId);
        if (user!.TrialUsed) return Ok(new TrialStatusResponse(false, "Пробный период уже использован"));
        var hasSubs = await db.Subscriptions.AnyAsync(s => s.UserId == userId);
        if (hasSubs) return Ok(new TrialStatusResponse(false, "У вас уже есть подписки"));
        return Ok(new TrialStatusResponse(true, null));
    }

    [HttpPost("trial")]
    public async Task<IActionResult> ActivateTrial()
    {
        var userId = GetUserId();
        var user = await db.Users.FindAsync(userId);
        if (user!.TrialUsed) return BadRequest(new { error = "Пробный период уже использован" });
        if (await db.Subscriptions.AnyAsync(s => s.UserId == userId))
            return BadRequest(new { error = "У вас уже есть подписки" });

        var remnaUser = await remna.CreateUserAsync(user.Id, user.Email, 7, 10L * 1024 * 1024 * 1024, 1);
        var sub = new Subscription
        {
            UserId = userId,
            RemnaUuid = remnaUser.Uuid,
            RemnaShortUuid = remnaUser.ShortUuid,
            SubscriptionUrl = remnaUser.SubscriptionUrl,
            Status = SubscriptionStatus.Active,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            TrafficLimitBytes = 10L * 1024 * 1024 * 1024,
            DeviceLimit = 1
        };
        db.Subscriptions.Add(sub);
        user.TrialUsed = true;
        await db.SaveChangesAsync();

        return Ok(new SubscriptionDto(sub.Id, sub.Status.ToString(), sub.ExpiresAt,
            sub.TrafficLimitBytes, sub.DeviceLimit, sub.SubscriptionUrl, sub.RemnaShortUuid));
    }

    [HttpPost("validate-promo")]
    public async Task<IActionResult> ValidatePromo(ValidatePromoRequest req)
    {
        var plan = Plans.FirstOrDefault(p => p.Id == req.PlanId);
        if (plan is null) return BadRequest(new { error = "Тариф не найден" });
        var result = await promo.ValidateAsync(req.Code, plan.Price);
        return Ok(new ValidatePromoResponse(result.Valid, result.Error,
            result.Type?.ToString(), result.Discount, result.BonusDays, result.FinalPrice));
    }

    [HttpPost("buy")]
    public async Task<ActionResult<PaymentInitResponse>> Buy(BuyRequest req)
    {
        var plan = Plans.FirstOrDefault(p => p.Id == req.PlanId);
        if (plan is null) return BadRequest(new { error = "Тариф не найден" });

        var userId = GetUserId();
        if (!await IsEmailVerifiedAsync(userId))
            return BadRequest(new { error = "Подтвердите email перед покупкой подписки" });

        decimal finalPrice = plan.Price;
        int bonusDays = 0;
        int? promoId = null;

        if (!string.IsNullOrEmpty(req.PromoCode))
        {
            var promoResult = await promo.ValidateAsync(req.PromoCode, plan.Price);
            if (!promoResult.Valid) return BadRequest(new { error = promoResult.Error });
            finalPrice = promoResult.FinalPrice;
            bonusDays = promoResult.BonusDays;
            promoId = promoResult.PromoCodeId;
        }

        var payment = new Payment
        {
            UserId = userId,
            YookassaPaymentId = "",
            Amount = finalPrice,
            OriginalAmount = plan.Price,
            Status = PaymentStatus.Pending,
            Purpose = PaymentPurpose.Subscription,
            PromoCodeId = promoId,
            DurationDays = plan.Days + bonusDays,
            TrafficBytes = plan.TrafficBytes
        };
        db.Payments.Add(payment);
        await db.SaveChangesAsync();

        var result = await yoo.CreatePaymentAsync(finalPrice, $"Подписка «{plan.Name}»", payment.Id.ToString(), req.SavePaymentMethod);
        payment.YookassaPaymentId = result.Id;
        await db.SaveChangesAsync();

        return Ok(new PaymentInitResponse(result.ConfirmationUrl, result.Id));
    }

    [HttpPost("renew")]
    public async Task<ActionResult<PaymentInitResponse>> Renew(RenewRequest req)
    {
        var plan = Plans.FirstOrDefault(p => p.Id == req.PlanId);
        if (plan is null) return BadRequest(new { error = "Тариф не найден" });

        var userId = GetUserId();
        if (!await IsEmailVerifiedAsync(userId))
            return BadRequest(new { error = "Подтвердите email перед покупкой подписки" });

        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.Id == req.SubscriptionId && s.UserId == userId);
        if (sub is null) return NotFound(new { error = "Подписка не найдена" });

        decimal finalPrice = plan.Price;
        int bonusDays = 0;
        int? promoId = null;

        if (!string.IsNullOrEmpty(req.PromoCode))
        {
            var promoResult = await promo.ValidateAsync(req.PromoCode, plan.Price);
            if (!promoResult.Valid) return BadRequest(new { error = promoResult.Error });
            finalPrice = promoResult.FinalPrice;
            bonusDays = promoResult.BonusDays;
            promoId = promoResult.PromoCodeId;
        }

        var payment = new Payment
        {
            UserId = userId,
            SubscriptionId = sub.Id,
            YookassaPaymentId = "",
            Amount = finalPrice,
            OriginalAmount = plan.Price,
            Status = PaymentStatus.Pending,
            Purpose = PaymentPurpose.Subscription,
            PromoCodeId = promoId,
            DurationDays = plan.Days + bonusDays,
            TrafficBytes = plan.TrafficBytes
        };
        db.Payments.Add(payment);
        await db.SaveChangesAsync();

        var result = await yoo.CreatePaymentAsync(finalPrice, $"Продление «{plan.Name}»", payment.Id.ToString(), req.SavePaymentMethod);
        payment.YookassaPaymentId = result.Id;
        await db.SaveChangesAsync();

        return Ok(new PaymentInitResponse(result.ConfirmationUrl, result.Id));
    }

    [HttpPost("auto-renew/toggle")]
    public async Task<IActionResult> ToggleAutoRenew(AutoRenewToggleRequest req)
    {
        var userId = GetUserId();
        var user = await db.Users.FindAsync(userId);
        if (user!.YookassaPaymentMethodId is null && req.Enabled)
            return BadRequest(new { error = "Нет сохранённого метода оплаты. Оплатите подписку с опцией сохранения карты." });
        user.AutoRenewEnabled = req.Enabled;
        await db.SaveChangesAsync();
        return Ok(new { enabled = req.Enabled });
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> YookassaWebhook()
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();
        Console.WriteLine($"[WEBHOOK] Body: {body}");

        if (string.IsNullOrWhiteSpace(body)) return Ok();

        using var doc = System.Text.Json.JsonDocument.Parse(body);
        var root = doc.RootElement;

        if (!root.TryGetProperty("event", out var evt) || evt.GetString() != "payment.succeeded")
            return Ok();

        var paymentObj = root.GetProperty("object");
        var paymentId = paymentObj.GetProperty("id").GetString()!;
        var orderId = paymentObj.GetProperty("metadata").GetProperty("order_id").GetString()!;

        if (!int.TryParse(orderId, out var paymentDbId)) return Ok();

        var payment = await db.Payments
            .Include(p => p.Subscription)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == paymentDbId && p.YookassaPaymentId == paymentId);

        if (payment is null || payment.Status == PaymentStatus.Succeeded) return Ok();

        payment.Status = PaymentStatus.Succeeded;
        payment.PaidAt = DateTime.UtcNow;

        if (paymentObj.TryGetProperty("payment_method", out var pm) &&
            pm.TryGetProperty("saved", out var saved) && saved.GetBoolean() &&
            pm.TryGetProperty("id", out var pmId))
        {
            payment.User.YookassaPaymentMethodId = pmId.GetString();
        }

        if (payment.PromoCodeId.HasValue)
            await promo.ApplyAsync(payment.PromoCodeId.Value);

        try
        {
            if (payment.Purpose == PaymentPurpose.Gift)
            {
                var gift = await db.GiftCodes.FirstOrDefaultAsync(g => g.PaymentId == payment.Id);
                if (gift is not null)
                {
                    var giftSvc = HttpContext.RequestServices.GetRequiredService<GiftService>();
                    gift.Code = await giftSvc.GenerateUniqueCodeAsync();
                    Console.WriteLine($"[WEBHOOK] Gift code: {gift.Code}");
                }
            }
            else if (payment.SubscriptionId.HasValue && payment.Subscription is not null)
            {
                await remna.RenewUserAsync(payment.Subscription.RemnaUuid, payment.DurationDays);
                payment.Subscription.ExpiresAt = payment.Subscription.ExpiresAt > DateTime.UtcNow
                    ? payment.Subscription.ExpiresAt.AddDays(payment.DurationDays)
                    : DateTime.UtcNow.AddDays(payment.DurationDays);
                payment.Subscription.Status = SubscriptionStatus.Active;
            }
            else
            {
                var user = payment.User;
                var remnaUser = await remna.CreateUserAsync(user.Id, user.Email, payment.DurationDays, payment.TrafficBytes, 3);
                var sub = new Subscription
                {
                    UserId = payment.UserId,
                    RemnaUuid = remnaUser.Uuid,
                    RemnaShortUuid = remnaUser.ShortUuid,
                    SubscriptionUrl = remnaUser.SubscriptionUrl,
                    Status = SubscriptionStatus.Active,
                    ExpiresAt = DateTime.UtcNow.AddDays(payment.DurationDays),
                    TrafficLimitBytes = payment.TrafficBytes,
                    DeviceLimit = 3
                };
                db.Subscriptions.Add(sub);
                await db.SaveChangesAsync();
                payment.SubscriptionId = sub.Id;

                if (user.ReferredById.HasValue)
                    await referral.AwardBonusAsync(user.ReferredById.Value, user.Id);
            }

            await db.SaveChangesAsync();
            Console.WriteLine("[WEBHOOK] Done");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WEBHOOK] ERROR: {ex.Message}\n{ex}");
            return StatusCode(500);
        }

        return Ok();
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> IsEmailVerifiedAsync(int userId)
    {
        var user = await db.Users.FindAsync(userId);
        return user?.IsEmailVerified ?? false;
    }
}
