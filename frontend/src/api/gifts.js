import client from './client'
export const buyGift    = planId => client.post('/gifts/buy', { planId }).then(r => r.data)
export const redeemGift = code   => client.post('/gifts/redeem', { code }).then(r => r.data)
export const getMyGifts = ()     => client.get('/gifts/mine').then(r => r.data)
