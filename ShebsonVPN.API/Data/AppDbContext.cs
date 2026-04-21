using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Models;

namespace ShebsonVPN.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<SupportTicket> Tickets => Set<SupportTicket>();
    public DbSet<TicketMessage> TicketMessages => Set<TicketMessage>();
    public DbSet<PromoCode> PromoCodes => Set<PromoCode>();
    public DbSet<ReferralBonus> ReferralBonuses => Set<ReferralBonus>();
    public DbSet<GiftCode> GiftCodes => Set<GiftCode>();
    public DbSet<SentNotification> SentNotifications => Set<SentNotification>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<User>().HasIndex(u => u.ReferralCode).IsUnique();
        b.Entity<User>()
            .HasOne(u => u.ReferredBy)
            .WithMany()
            .HasForeignKey(u => u.ReferredById)
            .OnDelete(DeleteBehavior.SetNull);

        b.Entity<Payment>().Property(p => p.Amount).HasPrecision(18, 2);
        b.Entity<Payment>().Property(p => p.OriginalAmount).HasPrecision(18, 2);

        b.Entity<PromoCode>().HasIndex(p => p.Code).IsUnique();
        b.Entity<PromoCode>().Property(p => p.Value).HasPrecision(18, 2);

        b.Entity<GiftCode>().HasIndex(g => g.Code).IsUnique();

        b.Entity<SentNotification>()
            .HasIndex(s => new { s.SubscriptionId, s.NotificationType })
            .IsUnique();

        b.Entity<ReferralBonus>()
            .HasOne(r => r.Referrer)
            .WithMany(u => u.ReferralBonusesGiven)
            .HasForeignKey(r => r.ReferrerId)
            .OnDelete(DeleteBehavior.Cascade);

        b.Entity<ReferralBonus>()
            .HasOne(r => r.ReferralUser)
            .WithMany()
            .HasForeignKey(r => r.ReferralUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
