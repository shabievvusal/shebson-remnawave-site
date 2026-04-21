using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;
using ShebsonVPN.API.Models;

namespace ShebsonVPN.API.Services;

public class ExpiryNotificationService(IServiceScopeFactory scopeFactory, ILogger<ExpiryNotificationService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await Task.Delay(TimeSpan.FromMinutes(2), ct);
        while (!ct.IsCancellationRequested)
        {
            try { await CheckAndNotifyAsync(); }
            catch (Exception ex) { logger.LogError(ex, "ExpiryNotification error"); }
            await Task.Delay(TimeSpan.FromHours(12), ct);
        }
    }

    private async Task CheckAndNotifyAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<EmailService>();

        var window = DateTime.UtcNow.AddDays(3);
        var soon = await db.Subscriptions
            .Include(s => s.User)
            .Where(s => s.Status == SubscriptionStatus.Active
                     && s.ExpiresAt >= DateTime.UtcNow
                     && s.ExpiresAt <= window)
            .ToListAsync();

        foreach (var sub in soon)
        {
            var exists = await db.SentNotifications.AnyAsync(n =>
                n.SubscriptionId == sub.Id && n.NotificationType == "expiry_3days");
            if (exists) continue;

            await email.SendExpiryReminderAsync(sub.User.Email, sub.User.FirstName, sub.ExpiresAt, sub.Id);
            db.SentNotifications.Add(new SentNotification { SubscriptionId = sub.Id, NotificationType = "expiry_3days" });
        }

        await db.SaveChangesAsync();
        logger.LogInformation("ExpiryNotification: checked {Count} expiring subs", soon.Count);
    }
}
