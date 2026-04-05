import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getUserByUid, createUser, getUsers } from './storage'
import { DEFAULT_ROLE } from './constants'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        let profile = await getUserByUid(firebaseUser.uid)
        if (!profile) {
          // First user to log in becomes admin
          const existingUsers = await getUsers()
          const assignedRole = existingUsers.length === 0 ? 'admin' : DEFAULT_ROLE
          profile = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.email.split('@')[0],
            role: assignedRole,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          await createUser(profile)
        }
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const role = userProfile?.role || DEFAULT_ROLE
  const isAdmin = role === 'admin' || role === 'purchasing'
  const isPurchasing = role === 'purchasing'
  const isBuilder = role === 'builder'

  return (
    <UserContext.Provider value={{
      user,
      userProfile,
      loading,
      role,
      isAdmin,
      isPurchasing,
      isBuilder,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within UserProvider')
  return context
}
