namespace ShebsonVPN.API.DTOs;

public record PlanDto(string Id, string Name, decimal Price, int Days, long TrafficBytes, int Devices, string Description);

public record SubscriptionDto(
    int Id,
    string Status,
    DateTime ExpiresAt,
    long TrafficLimitBytes,
    int DeviceLimit,
    string SubscriptionUrl,
    string ShortUuid,
    long UsedTrafficBytes = 0
);

public record BuyRequest(string PlanId, string? PromoCode = null, bool SavePaymentMethod = false);
public record RenewRequest(int SubscriptionId, string PlanId, string? PromoCode = null, bool SavePaymentMethod = false);

public record PaymentInitResponse(string PaymentUrl, string YookassaPaymentId);

public record ValidatePromoRequest(string Code, string PlanId);
public record ValidatePromoResponse(bool Valid, string? Error, string? PromoType, decimal Discount, int BonusDays, decimal FinalPrice);

public record TrialStatusResponse(bool Available, string? Reason);
public record AutoRenewToggleRequest(bool Enabled);
