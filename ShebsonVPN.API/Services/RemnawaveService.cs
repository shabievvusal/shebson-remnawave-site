using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ShebsonVPN.API.Services;

public class RemnawaveService(IConfiguration config, IHttpClientFactory http)
{
    private readonly string _baseUrl = config["Remnawave:Url"]!;
    private readonly string _token = config["Remnawave:Token"]!;
    private readonly string _inbound = config["Remnawave:Inbound"]!;
    private readonly string? _cookie = config["Remnawave:Cookie"];

    private HttpClient CreateClient()
    {
        var client = http.CreateClient("remnawave");
        client.BaseAddress = new Uri(_baseUrl.TrimEnd('/') + "/");
        client.DefaultRequestVersion = new Version(1, 1);
        client.DefaultVersionPolicy = HttpVersionPolicy.RequestVersionExact;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-Api-Key", _token);
        if (!string.IsNullOrEmpty(_cookie))
            client.DefaultRequestHeaders.TryAddWithoutValidation("Cookie", _cookie);
        return client;
    }

    public async Task<RemnawaveUser> CreateUserAsync(long telegramId, string email, int days, long trafficBytes, int deviceLimit)
    {
        var uuid = Guid.NewGuid().ToString();
        var shortUuid = $"web_{uuid[..8]}";

        var payload = new
        {
            username = $"web_{telegramId}_{uuid[..6]}",
            status = "ACTIVE",
            shortUuid,
            vlessUuid = uuid,
            uuid,
            trafficLimitBytes = trafficBytes,
            trafficLimitStrategy = "NO_RESET",
            activeInternalSquads = new[] { _inbound },
            expireAt = DateTime.UtcNow.AddDays(days).ToString("o"),
            telegramId,
            email,
            hwidDeviceLimit = deviceLimit,
            tag = (string?)null,
            externalSquadUuid = (string?)null,
            createdAt = DateTime.UtcNow.ToString("o"),
            lastTrafficResetAt = DateTime.UtcNow.ToString("o"),
            description = $"Created via web for {email}"
        };

        var client = CreateClient();
        var resp = await client.PostAsync("api/users", Json(payload));
        resp.EnsureSuccessStatusCode();

        var data = await Deserialize<JsonElement>(resp);
        var response = data.GetProperty("response");

        return new RemnawaveUser
        {
            Uuid = uuid,
            ShortUuid = response.TryGetProperty("shortUuid", out var su) ? su.GetString()! : shortUuid,
            SubscriptionUrl = response.TryGetProperty("subscriptionUrl", out var url) ? url.GetString()! : ""
        };
    }

    public async Task<(bool Exists, long UsedBytes)> GetUserInfoAsync(string uuid)
    {
        try
        {
            var client = CreateClient();
            var resp = await client.GetAsync($"api/users/{uuid}");
            if (!resp.IsSuccessStatusCode) return (false, 0);
            var data = await Deserialize<JsonElement>(resp);
            var user = data.GetProperty("response");
            long used = 0;
            if (user.TryGetProperty("userTraffic", out var traffic) &&
                traffic.TryGetProperty("usedTrafficBytes", out var usedProp))
                used = usedProp.GetInt64();
            return (true, used);
        }
        catch { return (false, 0); }
    }

    public async Task<long> GetUsedTrafficAsync(string uuid) =>
        (await GetUserInfoAsync(uuid)).UsedBytes;

    public async Task RenewUserAsync(string uuid, int days, long bonusTrafficBytes = 0)
    {
        var client = CreateClient();
        var resp = await client.GetAsync($"api/users/{uuid}");
        resp.EnsureSuccessStatusCode();
        var data = await Deserialize<JsonElement>(resp);
        var user = data.GetProperty("response");

        var currentExpire = user.GetProperty("expireAt").GetString()!;
        var expire = DateTime.Parse(currentExpire, null, System.Globalization.DateTimeStyles.RoundtripKind);
        if (expire < DateTime.UtcNow) expire = DateTime.UtcNow;
        var newExpire = expire.AddDays(days);

        var squads = user.GetProperty("activeInternalSquads").EnumerateArray()
            .Select(s => s.TryGetProperty("uuid", out var id) ? id.GetString() : s.GetString())
            .ToArray();

        var currentTraffic = user.GetProperty("trafficLimitBytes").GetInt64();

        var payload = new
        {
            uuid,
            expireAt = newExpire.ToString("o"),
            status = "ACTIVE",
            trafficLimitBytes = currentTraffic + bonusTrafficBytes,
            trafficLimitStrategy = user.GetProperty("trafficLimitStrategy").GetString(),
            hwidDeviceLimit = user.GetProperty("hwidDeviceLimit").GetInt32(),
            telegramId = user.TryGetProperty("telegramId", out var tid) ? (long?)tid.GetInt64() : null,
            email = user.GetProperty("email").GetString(),
            lastTrafficResetAt = DateTime.UtcNow.ToString("o"),
            tag = (string?)null,
            activeInternalSquads = squads
        };

        var patch = await client.PatchAsync("api/users", Json(payload));
        patch.EnsureSuccessStatusCode();

        await client.PostAsync($"api/users/{uuid}/actions/reset-traffic", null);
    }

    private static StringContent Json(object obj) =>
        new(JsonSerializer.Serialize(obj), Encoding.UTF8, "application/json");

    private static async Task<T> Deserialize<T>(HttpResponseMessage resp) =>
        JsonSerializer.Deserialize<T>(await resp.Content.ReadAsStringAsync())!;
}

public record RemnawaveUser(string Uuid = "", string ShortUuid = "", string SubscriptionUrl = "");
