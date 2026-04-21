import client from './client'

export const getPlans        = () => client.get('/subscriptions/plans').then(r => r.data)
export const getMine         = () => client.get('/subscriptions').then(r => r.data)
export const buy             = (planId, promoCode, savePaymentMethod) =>
  client.post('/subscriptions/buy', { planId, promoCode, savePaymentMethod }).then(r => r.data)
export const renew           = (subscriptionId, planId, promoCode, savePaymentMethod) =>
  client.post('/subscriptions/renew', { subscriptionId, planId, promoCode, savePaymentMethod }).then(r => r.data)
export const validatePromo   = (code, planId) =>
  client.post('/subscriptions/validate-promo', { code, planId }).then(r => r.data)
export const getTrialStatus  = () => client.get('/subscriptions/trial-status').then(r => r.data)
export const activateTrial   = () => client.post('/subscriptions/trial').then(r => r.data)
export const toggleAutoRenew = enabled =>
  client.post('/subscriptions/auto-renew/toggle', { enabled }).then(r => r.data)
