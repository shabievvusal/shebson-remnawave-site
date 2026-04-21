import { createContext, useContext, useState, useCallback } from 'react'

const Ctx = createContext(null)

function parseJwt(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    const emailVerified = payload['email_verified']
    return { isAdmin: role === 'Admin', isEmailVerified: emailVerified === 'true' }
  } catch { return { isAdmin: false, isEmailVerified: false } }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    const email = localStorage.getItem('email')
    const firstName = localStorage.getItem('firstName')
    if (!token) return null
    const { isAdmin, isEmailVerified } = parseJwt(token)
    return { token, email, firstName, isAdmin, isEmailVerified }
  })

  const login = useCallback((data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('email', data.email)
    localStorage.setItem('firstName', data.firstName ?? '')
    const { isAdmin, isEmailVerified } = parseJwt(data.token)
    setUser({ ...data, isAdmin, isEmailVerified })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    localStorage.removeItem('firstName')
    setUser(null)
  }, [])

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
