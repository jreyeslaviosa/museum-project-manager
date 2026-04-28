import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { auth } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { getUserByUid, getUserByEmail, createUser, getUsers, updateUser, isEmailAllowed } from './storage'
import { DEFAULT_ROLE } from './constants'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  const loadTeamMembers = useCallback(async () => {
    const users = await getUsers()
    setTeamMembers(users)
    return users
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check allowlist (empty allowlist = allow everyone for first-time setup)
        const allowed = await isEmailAllowed(firebaseUser.email)
        if (!allowed) {
          await signOut(auth)
          setUser(null)
          setUserProfile(null)
          setAccessDenied(true)
          setLoading(false)
          return
        }
        setAccessDenied(false)
        setUser(firebaseUser)

        // Check if profile exists by UID
        let profile = await getUserByUid(firebaseUser.uid)

        if (!profile) {
          // Check if admin pre-created a profile by email
          const preCreated = await getUserByEmail(firebaseUser.email)
          if (preCreated) {
            // Link the pre-created profile to this Firebase UID
            await updateUser(preCreated.id, { uid: firebaseUser.uid })
            profile = { ...preCreated, uid: firebaseUser.uid }
          } else {
            // First user becomes admin, others get default role
            const existingUsers = await getUsers()
            const assignedRole = existingUsers.length === 0 ? 'admin' : DEFAULT_ROLE
            profile = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              firstName: '',
              lastName: '',
              name: firebaseUser.email.split('@')[0],
              role: assignedRole,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            await createUser(profile)
          }
        }
        setUserProfile(profile)
        await loadTeamMembers()
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [loadTeamMembers])

  const role = userProfile?.role || DEFAULT_ROLE
  const isAdmin = role === 'admin' || role === 'purchasing'
  const isPurchasing = role === 'purchasing'
  const isBuilder = role === 'builder'

  // Team member names for dropdowns (sorted)
  const teamMemberNames = teamMembers
    .map(u => {
      if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim()
      return u.name || u.email?.split('@')[0] || ''
    })
    .filter(Boolean)
    .sort()

  return (
    <UserContext.Provider value={{
      user,
      userProfile,
      loading,
      accessDenied,
      role,
      isAdmin,
      isPurchasing,
      isBuilder,
      teamMembers,
      teamMemberNames,
      loadTeamMembers,
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
