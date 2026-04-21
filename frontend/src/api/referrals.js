import client from './client'
export const getReferralStats = () => client.get('/referrals/stats').then(r => r.data)
