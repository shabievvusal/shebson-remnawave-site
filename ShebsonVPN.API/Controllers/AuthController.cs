using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;
using ShebsonVPN.API.DTOs;
using ShebsonVPN.API.Models;
using ShebsonVPN.API.Services;

namespace ShebsonVPN.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, JwtService jwt, ReferralService referral, EmailService email) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new { error = "Email уже зарегистрирован" });

        User? referrer = null;
        if (!string.IsNullOrEmpty(req.ReferralCode))
            referrer = await db.Users.FirstOrDefaultAsync(u => u.ReferralCode == req.ReferralCode.ToUpper());

        var verifyToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        var user = new User
        {
            Email = req.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            FirstName = req.FirstName,
            IsEmailVerified = false,
            EmailVerificationToken = verifyToken,
            ReferredById = referrer?.Id,
            ReferralCode = await referral.GenerateUniqueCodeAsync()
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        _ = email.SendVerificationAsync(user.Email, user.FirstName, verifyToken);

        return Ok(new AuthResponse(jwt.Generate(user), user.Email, user.FirstName));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower());
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Неверный email или пароль" });

        return Ok(new AuthResponse(jwt.Generate(user), user.Email, user.FirstName));
    }

    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
        if (user is null) return BadRequest(new { error = "Недействительная ссылка" });

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        await db.SaveChangesAsync();

        var newToken = jwt.Generate(user);
        return Ok(new { message = "Email подтверждён", token = newToken, email = user.Email, firstName = user.FirstName });
    }

    [HttpPost("resend-verification")]
    [Authorize]
    public async Task<IActionResult> ResendVerification()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return Unauthorized();
        if (user.IsEmailVerified) return BadRequest(new { error = "Email уже подтверждён" });

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.EmailVerificationToken = token;
        await db.SaveChangesAsync();
        _ = email.SendVerificationAsync(user.Email, user.FirstName, token);

        return Ok(new { message = "Письмо отправлено" });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower());
        if (user is not null)
        {
            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            user.PasswordResetToken = token;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
            await db.SaveChangesAsync();
            _ = email.SendPasswordResetAsync(user.Email, user.FirstName, token);
        }
        return Ok(new { message = "Если аккаунт существует, письмо отправлено" });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest req)
    {
        if (req.NewPassword.Length < 8)
            return BadRequest(new { error = "Пароль должен быть минимум 8 символов" });

        var user = await db.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == req.Token &&
            u.PasswordResetTokenExpiry > DateTime.UtcNow);

        if (user is null)
            return BadRequest(new { error = "Ссылка недействительна или истекла" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await db.SaveChangesAsync();

        return Ok(new { message = "Пароль успешно изменён" });
    }
}
