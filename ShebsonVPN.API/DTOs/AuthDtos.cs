namespace ShebsonVPN.API.DTOs;

public record RegisterRequest(string Email, string Password, string? FirstName, string? ReferralCode = null);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, string Email, string? FirstName);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
public record ResendVerificationRequest(string Email);
