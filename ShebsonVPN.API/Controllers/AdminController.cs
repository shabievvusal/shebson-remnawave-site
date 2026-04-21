using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;
using ShebsonVPN.API.Models;

namespace ShebsonVPN.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController(AppDbContext db) : ControllerBase
{
    // ── Stats ────────────────────────────────────────────────────────────────

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var monthAgo = today.AddDays(-30);

        var totalUsers = await db.Users.CountAsync();
        var newUsersToday = await db.Users.CountAsync(u => u.CreatedAt >= today);
        var newUsersMonth = await db.Users.CountAsync(u => u.CreatedAt >= monthAgo);
        var activeSubs = await db.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Active);
        var totalRevenue = await db.Payments.Where(p => p.Status == PaymentStatus.Succeeded).SumAsync(p => (decimal?)p.Amount) ?? 0;
        var revenueMonth = await db.Payments.Where(p => p.Status == PaymentStatus.Succeeded && p.PaidAt >= monthAgo).SumAsync(p => (decimal?)p.Amount) ?? 0;
        var pendingPayments = await db.Payments.CountAsync(p => p.Status == PaymentStatus.Pending);

        return Ok(new
        {
            totalUsers, newUsersToday, newUsersMonth,
            activeSubs, totalRevenue, revenueMonth, pendingPayments
        });
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = db.Users.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.Email.Contains(search) || (u.FirstName != null && u.FirstName.Contains(search)));

        var total = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id, u.Email, u.FirstName, u.CreatedAt,
                u.IsAdmin, u.IsBanned, u.TrialUsed,
                activeSubs = u.Subscriptions.Count(s => s.Status == SubscriptionStatus.Active),
                totalPayments = u.Subscriptions.SelectMany(s => db.Payments.Where(p => p.SubscriptionId == s.Id && p.Status == PaymentStatus.Succeeded)).Sum(p => (decimal?)p.Amount) ?? 0
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, users });
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        var subs = await db.Subscriptions.Where(s => s.UserId == id).OrderByDescending(s => s.CreatedAt).ToListAsync();
        var payments = await db.Payments.Where(p => p.UserId == id).OrderByDescending(p => p.CreatedAt).ToListAsync();

        return Ok(new { user, subs, payments });
    }

    [HttpPost("users/{id}/ban")]
    public async Task<IActionResult> BanUser(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        user.IsBanned = !user.IsBanned;
        await db.SaveChangesAsync();
        return Ok(new { user.Id, user.IsBanned });
    }

    [HttpPost("users/{id}/make-admin")]
    public async Task<IActionResult> MakeAdmin(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        user.IsAdmin = !user.IsAdmin;
        await db.SaveChangesAsync();
        return Ok(new { user.Id, user.IsAdmin });
    }

    // ── Promo Codes ───────────────────────────────────────────────────────────

    [HttpGet("promo-codes")]
    public async Task<IActionResult> GetPromoCodes()
    {
        var codes = await db.PromoCodes.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(codes);
    }

    [HttpPost("promo-codes")]
    public async Task<IActionResult> CreatePromoCode([FromBody] CreatePromoRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Code)) return BadRequest(new { error = "Код не может быть пустым" });
        if (await db.PromoCodes.AnyAsync(p => p.Code == req.Code.ToUpper()))
            return Conflict(new { error = "Такой промокод уже существует" });

        var promo = new PromoCode
        {
            Code = req.Code.ToUpper().Trim(),
            Type = req.Type,
            Value = req.Value,
            MaxUses = req.MaxUses,
            ExpiresAt = req.ExpiresAt,
            IsActive = true
        };
        db.PromoCodes.Add(promo);
        await db.SaveChangesAsync();
        return Ok(promo);
    }

    [HttpPost("promo-codes/{id}/toggle")]
    public async Task<IActionResult> TogglePromo(int id)
    {
        var promo = await db.PromoCodes.FindAsync(id);
        if (promo is null) return NotFound();
        promo.IsActive = !promo.IsActive;
        await db.SaveChangesAsync();
        return Ok(promo);
    }

    [HttpDelete("promo-codes/{id}")]
    public async Task<IActionResult> DeletePromo(int id)
    {
        var promo = await db.PromoCodes.FindAsync(id);
        if (promo is null) return NotFound();
        db.PromoCodes.Remove(promo);
        await db.SaveChangesAsync();
        return Ok();
    }

    // ── Payments ──────────────────────────────────────────────────────────────

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        var total = await db.Payments.CountAsync();
        var payments = await db.Payments
            .Include(p => p.User)
            .Include(p => p.PromoCode)
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id, p.Amount, p.OriginalAmount, p.Status, p.Purpose,
                p.CreatedAt, p.PaidAt, p.DurationDays,
                userEmail = p.User.Email,
                userId = p.UserId,
                promoCode = p.PromoCode != null ? p.PromoCode.Code : null
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, payments });
    }

    // ── Gift Codes ────────────────────────────────────────────────────────────

    [HttpGet("gift-codes")]
    public async Task<IActionResult> GetGiftCodes([FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        var total = await db.GiftCodes.CountAsync();
        var gifts = await db.GiftCodes
            .Include(g => g.BoughtByUser)
            .Include(g => g.RedeemedByUser)
            .OrderByDescending(g => g.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new
            {
                g.Id, g.Code, g.PlanId, g.IsUsed, g.CreatedAt, g.RedeemedAt,
                boughtBy = g.BoughtByUser.Email,
                redeemedBy = g.RedeemedByUser != null ? g.RedeemedByUser.Email : null
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, gifts });
    }
}

public record CreatePromoRequest(string Code, PromoType Type, decimal Value, int MaxUses, DateTime? ExpiresAt);
