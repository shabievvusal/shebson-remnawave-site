import client from './client'

export const getTickets  = () => client.get('/tickets').then(r => r.data)
export const getTicket   = id => client.get(`/tickets/${id}`).then(r => r.data)
export const createTicket = (subject, message) =>
  client.post('/tickets', { subject, message }).then(r => r.data)
export const replyTicket = (id, message) =>
  client.post(`/tickets/${id}/reply`, { message }).then(r => r.data)
export const closeTicket = id => client.post(`/tickets/${id}/close`).then(r => r.data)
