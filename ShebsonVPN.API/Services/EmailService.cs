using MailKit.Net.Smtp;
using MimeKit;

namespace ShebsonVPN.API.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger)
{
    private readonly string? _host = config["Email:SmtpHost"];
    private readonly int _port = int.TryParse(config["Email:SmtpPort"], out var p) ? p : 587;
    private readonly string? _user = config["Email:SmtpUser"];
    private readonly string? _pass = config["Email:SmtpPassword"];
    private readonly string _from = config["Email:FromAddress"] ?? "noreply@shebsonremna.spb.ru";
    private readonly string _fromName = config["Email:FromName"] ?? "ShebsonVPN";
    private readonly string _baseUrl = config["AppBaseUrl"] ?? "https://my.shebsonremna.spb.ru";

    public bool IsConfigured => !string.IsNullOrEmpty(_host) && !string.IsNullOrEmpty(_user);

    public async Task SendExpiryReminderAsync(string toEmail, string? firstName, DateTime expiresAt, int subId)
    {
        await SendAsync(toEmail, firstName, "Ваша подписка скоро истечёт", $"""
            <div {Style.Wrap}>
              <div {Style.Logo}>ShebsonVPN</div>
              <h2 {Style.H2}>Подписка истекает через 3 дня</h2>
              <p {Style.P}>Привет{(firstName is not null ? $", {firstName}" : "")}!</p>
              <p {Style.P}>Подписка <b>#{subId}</b> истекает <b>{expiresAt:d MMMM yyyy}</b>.</p>
              <p {Style.P}>Продлите её сейчас, чтобы не потерять доступ.</p>
              <a href="{_baseUrl}/buy" {Style.Btn}>Продлить подписку</a>
            </div>
            """);
    }

    public async Task SendVerificationAsync(string toEmail, string? firstName, string token)
    {
        var link = $"{_baseUrl}/verify-email?token={token}";
        await SendAsync(toEmail, firstName, "Подтвердите email — ShebsonVPN", $"""
            <div {Style.Wrap}>
              <div {Style.Logo}>ShebsonVPN</div>
              <h2 {Style.H2}>Подтвердите ваш email</h2>
              <p {Style.P}>Привет{(firstName is not null ? $", {firstName}" : "")}!</p>
              <p {Style.P}>Нажмите кнопку ниже, чтобы подтвердить адрес и получить доступ к покупке подписок.</p>
              <a href="{link}" {Style.Btn}>Подтвердить email</a>
              <p {Style.PMuted}>Если вы не регистрировались — просто проигнорируйте это письмо.</p>
            </div>
            """);
    }

    public async Task SendPasswordResetAsync(string toEmail, string? firstName, string token)
    {
        var link = $"{_baseUrl}/reset-password?token={token}";
        await SendAsync(toEmail, firstName, "Сброс пароля — ShebsonVPN", $"""
            <div {Style.Wrap}>
              <div {Style.Logo}>ShebsonVPN</div>
              <h2 {Style.H2}>Сброс пароля</h2>
              <p {Style.P}>Привет{(firstName is not null ? $", {firstName}" : "")}!</p>
              <p {Style.P}>Мы получили запрос на сброс пароля для вашего аккаунта.</p>
              <p {Style.P}>Ссылка действует <b>30 минут</b>.</p>
              <a href="{link}" {Style.Btn}>Сбросить пароль</a>
              <p {Style.PMuted}>Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
            </div>
            """);
    }

    private async Task SendAsync(string toEmail, string? firstName, string subject, string htmlBody)
    {
        if (!IsConfigured) return;
        try
        {
            var msg = new MimeMessage();
            msg.From.Add(new MailboxAddress(_fromName, _from));
            msg.To.Add(new MailboxAddress(firstName ?? toEmail, toEmail));
            msg.Subject = subject;
            msg.Body = new TextPart("html") { Text = htmlBody };

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_host, _port, MailKit.Security.SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_user, _pass);
            await smtp.SendAsync(msg);
            await smtp.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }

    private static class Style
    {
        public const string Wrap = """style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d10;color:#e5e5e7;border-radius:16px" """;
        public const string Logo = """style="font-size:1.25rem;font-weight:700;color:#ef4444;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px" """;
        public const string H2 = """style="color:#f0f0f8;margin-bottom:8px" """;
        public const string P = """style="color:#8b8ba7;line-height:1.6;margin:8px 0" """;
        public const string PMuted = """style="color:#4a4a6a;font-size:0.8rem;margin-top:20px" """;
        public const string Btn = """style="display:inline-block;margin-top:20px;padding:12px 24px;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none;font-weight:600" """;
    }
}
