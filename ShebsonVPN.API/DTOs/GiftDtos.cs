namespace ShebsonVPN.API.DTOs;

public record BuyGiftRequest(string PlanId);
public record BuyGiftResponse(string PaymentUrl, string YookassaPaymentId);
public record RedeemGiftRequest(string Code);
public record RedeemGiftResponse(int SubscriptionId, DateTime ExpiresAt, string SubscriptionUrl);
