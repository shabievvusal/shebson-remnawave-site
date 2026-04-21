using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ShebsonVPN.API.Services;

public class YookassaService(IConfiguration config, IHttpClientFactory http)
{
    private readonly string _shopId = config["Yookassa:ShopId"]!;
    private readonly string _secret = config["Yookassa:SecretKey"]!;
    private readonly string _returnUrl = config["Yookassa:ReturnUrl"]!;

    public async Task<YookassaPaymentResult> CreatePaymentAsync(decimal amount, string description, string orderId, bool savePaymentMethod = false)
    {
        var client = CreateClient();
        var amountStr = amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);

        object payload = savePaymentMethod
            ? new
            {
                amount = new { value = amountStr, currency = "RUB" },
                capture = true,
                save_payment_method = true,
                confirmation = new { type = "redirect", return_url = _returnUrl },
                description,
                metadata = new { order_id = orderId }
            }
            : new
            {
                amount = new { value = amountStr, currency = "RUB" },
                capture = true,
                confirmation = new { type = "redirect", return_url = _returnUrl },
                description,
                metadata = new { order_id = orderId }
            };

        var resp = await client.PostAsync(
            "https://api.yookassa.ru/v3/payments",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        );
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var root = doc.RootElement;

        return new YookassaPaymentResult(
            Id: root.GetProperty("id").GetString()!,
            ConfirmationUrl: root.GetProperty("confirmation").GetProperty("confirmation_url").GetString()!,
            Status: root.GetProperty("status").GetString()!
        );
    }

    public async Task<YookassaPaymentResult> CreateAutoPaymentAsync(decimal amount, string description, string paymentMethodId)
    {
        var client = CreateClient();
        var amountStr = amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
        var orderId = Guid.NewGuid().ToString("N")[..12];

        var payload = new
        {
            amount = new { value = amountStr, currency = "RUB" },
            capture = true,
            payment_method_id = paymentMethodId,
            description,
            metadata = new { order_id = orderId }
        };

        var resp = await client.PostAsync(
            "https://api.yookassa.ru/v3/payments",
            new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        );
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var root = doc.RootElement;

        return new YookassaPaymentResult(
            Id: root.GetProperty("id").GetString()!,
            ConfirmationUrl: "",
            Status: root.GetProperty("status").GetString()!
        );
    }

    private HttpClient CreateClient()
    {
        var client = http.CreateClient();
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_shopId}:{_secret}"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        client.DefaultRequestHeaders.Add("Idempotence-Key", Guid.NewGuid().ToString());
        return client;
    }

    public async Task<string> GetPaymentStatusAsync(string paymentId)
    {
        var client = CreateClient();

        var resp = await client.GetAsync($"https://api.yookassa.ru/v3/payments/{paymentId}");
        resp.EnsureSuccessStatusCode();

        using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("status").GetString()!;
    }
}

public record YookassaPaymentResult(string Id, string ConfirmationUrl, string Status);
