import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, doc, getDoc, onAuthStateChanged, User, OperationType, handleFirestoreError, signOut, setDoc, serverTimestamp } from '../firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user' | 'ngo';
  bio?: string;
  age?: number;
  gender?: string;
  avatar?: string;
  interests?: string[];
  createdAt: any;
  lastLogin?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isNGO: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isNGO: false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const profileDoc = await getDoc(userRef);
          
          if (profileDoc.exists()) {
            const data = profileDoc.data() as UserProfile;
            setProfile(data);
            
            // Update last login
            await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || 
             user?.email === 'vignayreddymuduganti@gmail.com' || 
             user?.email === 'vr7225274@gmail.com',
    isNGO: profile?.role === 'ngo',
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
