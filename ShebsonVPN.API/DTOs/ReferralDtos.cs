namespace ShebsonVPN.API.DTOs;

public record ReferralStatsResponse(string ReferralCode, string ReferralLink, int TotalReferrals, int PaidReferrals, int TotalBonusDays);
