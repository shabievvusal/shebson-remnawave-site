using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using ShebsonVPN.API.Data;

namespace ShebsonVPN.API.Services;

public class GiftService(AppDbContext db)
{
    private const string Chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public async Task<string> GenerateUniqueCodeAsync()
    {
        while (true)
        {
            var part1 = new string(Enumerable.Range(0, 4).Select(_ => Chars[RandomNumberGenerator.GetInt32(Chars.Length)]).ToArray());
            var part2 = new string(Enumerable.Range(0, 4).Select(_ => Chars[RandomNumberGenerator.GetInt32(Chars.Length)]).ToArray());
            var code = $"GIFT-{part1}-{part2}";
            if (!await db.GiftCodes.AnyAsync(g => g.Code == code))
                return code;
        }
    }
}
