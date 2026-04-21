import client from './client'

export const getStats = () => client.get('/admin/stats').then(r => r.data)

export const getUsers = (search, page = 1) =>
  client.get('/admin/users', { params: { search, page } }).then(r => r.data)

export const getUser = (id) => client.get(`/admin/users/${id}`).then(r => r.data)

export const banUser = (id) => client.post(`/admin/users/${id}/ban`).then(r => r.data)

export const makeAdmin = (id) => client.post(`/admin/users/${id}/make-admin`).then(r => r.data)

export const getPromoCodes = () => client.get('/admin/promo-codes').then(r => r.data)

export const createPromoCode = (data) => client.post('/admin/promo-codes', data).then(r => r.data)

export const togglePromo = (id) => client.post(`/admin/promo-codes/${id}/toggle`).then(r => r.data)

export const deletePromo = (id) => client.delete(`/admin/promo-codes/${id}`).then(r => r.data)

export const getPayments = (page = 1) =>
  client.get('/admin/payments', { params: { page } }).then(r => r.data)

export const getGiftCodes = (page = 1) =>
  client.get('/admin/gift-codes', { params: { page } }).then(r => r.data)
