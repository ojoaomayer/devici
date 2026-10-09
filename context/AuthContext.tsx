'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'

export interface UserProfile {
  uid: string
  email: string | null
  nome?: string
  plano: 'free' | 'pro' | 'construtora'
  planilhas_limite: number
  planilhas_usadas: number
  cupom_ativo?: string
  cupom_resgatado_em?: any
  criado_em?: any
}

interface AuthContextType {
  user: User | null
  userData: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, pass: string) => Promise<void>
  signUpWithEmail: (email: string, pass: string, nome?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const syncUserProfile = async (firebaseUser: User, extraName?: string) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          nome: extraName || firebaseUser.displayName || '',
          plano: 'free',
          planilhas_limite: 1,
          planilhas_usadas: 0,
          criado_em: serverTimestamp(),
        }
        await setDoc(userRef, newProfile)
        setUserData(newProfile)
      } else {
        setUserData(userSnap.data() as UserProfile)
      }
    } catch (err) {
      console.error('Error syncing user profile in Firestore:', err)
      // Fallback local profile in case Firestore write is restricted by security rules
      setUserData((prev) => prev || {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        nome: extraName || firebaseUser.displayName || '',
        plano: 'free',
        planilhas_limite: 1,
        planilhas_usadas: 0,
      })
    }
  }

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser)
          if (currentUser) {
            await syncUserProfile(currentUser)
            // Listen to live updates on user profile (usage count, plan upgrades)
            const userRef = doc(db, 'users', currentUser.uid)
            const unsubsDoc = onSnapshot(
              userRef,
              (docSnap) => {
                if (docSnap.exists()) {
                  setUserData(docSnap.data() as UserProfile)
                }
              },
              (err) => {
                console.warn('User profile snapshot error:', err)
              }
            )
            setLoading(false)
            return () => unsubsDoc()
          } else {
            setUserData(null)
            setLoading(false)
          }
        },
        (err) => {
          console.warn('onAuthStateChanged error:', err)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.warn('Failed to initialize auth listener:', err)
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider)
      if (res.user) {
        await syncUserProfile(res.user)
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass)
      if (res.user) {
        await syncUserProfile(res.user)
      }
    } catch (error: any) {
      console.error('Email Sign In Error:', error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, pass: string, nome?: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass)
      if (res.user) {
        if (nome) {
          await updateProfile(res.user, { displayName: nome })
        }
        await syncUserProfile(res.user, nome)
      }
    } catch (error: any) {
      console.error('Email Sign Up Error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      setUserData(null)
    } catch (error: any) {
      console.error('Sign Out Error:', error)
      throw error
    }
  }

  const refreshUserData = async () => {
    if (!user) return
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)
    if (snap.exists()) {
      setUserData(snap.data() as UserProfile)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
