import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAaweJvM9468bJShiyyQUSmYHD_peP8eWQ",
  authDomain: "museum-project-manager.firebaseapp.com",
  projectId: "museum-project-manager",
  storageBucket: "museum-project-manager.firebasestorage.app",
  messagingSenderId: "529580538694",
  appId: "1:529580538694:web:573138037720ac0160c347"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
