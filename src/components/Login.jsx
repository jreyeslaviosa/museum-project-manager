import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../utils/firebase'

const googleProvider = new GoogleAuthProvider()

function Login({ accessDenied }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no error needed
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Duplicate popup, ignore
      } else {
        setError('Sign in failed. Please try again.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-form">
        <h1>Museum Project Manager</h1>
        <p style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Sign in with your organization Google account
        </p>
        {accessDenied && (
          <p className="login-error">Access denied. Your account is not authorized to use this app. Contact an admin to request access.</p>
        )}
        {error && <p className="login-error">{error}</p>}
        <button
          className="btn btn-primary login-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  )
}

export default Login
