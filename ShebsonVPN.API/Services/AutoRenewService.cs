using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;
using ShebsonVPN.API.Models;

namespace ShebsonVPN.API.Services;

public class AutoRenewService(IServiceScopeFactory scopeFactory, ILogger<AutoRenewService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await Task.Delay(TimeSpan.FromMinutes(5), ct);
        while (!ct.IsCancellationRequested)
        {
            try { await ProcessAutoRenewalsAsync(); }
            catch (Exception ex) { logger.LogError(ex, "AutoRenew error"); }
            await Task.Delay(TimeSpan.FromHours(12), ct);
        }
    }

    private async Task ProcessAutoRenewalsAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var yoo = scope.ServiceProvider.GetRequiredService<YookassaService>();
        var remna = scope.ServiceProvider.GetRequiredService<RemnawaveService>();

        var deadline = DateTime.UtcNow.AddDays(2);
        var subs = await db.Subscriptions
            .Include(s => s.User)
            .Include(s => s.Payments)
            .Where(s => s.Status == SubscriptionStatus.Active
                     && s.ExpiresAt >= DateTime.UtcNow
                     && s.ExpiresAt <= deadline
                     && s.User.AutoRenewEnabled
                     && s.User.YookassaPaymentMethodId != null)
            .ToListAsync();

        foreach (var sub in subs)
        {
            var lastPayment = sub.Payments
                .Where(p => p.Status == PaymentStatus.Succeeded && p.Purpose == PaymentPurpose.Subscription)
                .OrderByDescending(p => p.PaidAt)
                .FirstOrDefault();

            if (lastPayment is null) continue;

            var alreadyPending = await db.Payments.AnyAsync(p =>
                p.SubscriptionId == sub.Id
                && p.Purpose == PaymentPurpose.AutoRenew
                && p.Status == PaymentStatus.Pending
                && p.CreatedAt >= DateTime.UtcNow.AddDays(-1));
            if (alreadyPending) continue;

            try
            {
                var result = await yoo.CreateAutoPaymentAsync(
                    lastPayment.Amount,
                    $"Автопродление подписки #{sub.Id}",
                    sub.User.YookassaPaymentMethodId!
                );

                var payment = new Payment
                {
                    UserId = sub.UserId,
                    SubscriptionId = sub.Id,
                    YookassaPaymentId = result.Id,
                    Amount = lastPayment.Amount,
                    OriginalAmount = lastPayment.Amount,
                    Status = result.Status == "succeeded" ? PaymentStatus.Succeeded : PaymentStatus.Pending,
                    Purpose = PaymentPurpose.AutoRenew,
                    DurationDays = lastPayment.DurationDays,
                    TrafficBytes = lastPayment.TrafficBytes
                };
                db.Payments.Add(payment);
                await db.SaveChangesAsync();

                if (result.Status == "succeeded")
                {
                    payment.PaidAt = DateTime.UtcNow;
                    await remna.RenewUserAsync(sub.RemnaUuid, payment.DurationDays);
                    sub.ExpiresAt = sub.ExpiresAt > DateTime.UtcNow
                        ? sub.ExpiresAt.AddDays(payment.DurationDays)
                        : DateTime.UtcNow.AddDays(payment.DurationDays);
                    await db.SaveChangesAsync();
                    logger.LogInformation("AutoRenew succeeded for sub #{SubId}", sub.Id);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "AutoRenew failed for sub #{SubId}", sub.Id);
            }
        }
    }
}
