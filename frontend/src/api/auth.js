import client from './client'

export const register = (email, password, firstName, referralCode) =>
  client.post('/auth/register', { email, password, firstName, referralCode }).then(r => r.data)

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then(r => r.data)

export const resendVerification = () =>
  client.post('/auth/resend-verification').then(r => r.data)
