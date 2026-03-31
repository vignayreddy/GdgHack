import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, onSnapshot, collection, query, where, orderBy, handleFirestoreError, OperationType, addDoc } from '../firebase';
import { useAuth } from './AuthContext';

interface StreakData {
  currentStreak: number;
  lastActive: any;
  history: string[]; // Array of YYYY-MM-DD strings
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

interface StreakContextType {
  streak: StreakData | null;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  updateStreak: () => Promise<void>;
}

const StreakContext = createContext<StreakContextType>({
  streak: null,
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  updateStreak: async () => {},
});

export const useStreak = () => useContext(StreakContext);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch Streak Data
  useEffect(() => {
    if (!user) {
      setStreak(null);
      return;
    }

    const streakRef = doc(db, 'streaks', user.uid);
    const unsubscribe = onSnapshot(streakRef, (doc) => {
      if (doc.exists()) {
        setStreak(doc.data() as StreakData);
      } else {
        // Initialize streak if it doesn't exist
        const initialStreak: StreakData = {
          currentStreak: 0,
          lastActive: serverTimestamp(),
          history: [],
        };
        setDoc(streakRef, initialStreak);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'streaks'));

    return () => unsubscribe();
  }, [user]);

  // Fetch Notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notifs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'notifications'));

    return () => unsubscribe();
  }, [user]);

  // Inactivity Check (Client-side simulation)
  useEffect(() => {
    if (!user || !streak) return;

    const checkInactivity = async () => {
      const lastActiveDate = streak.lastActive?.toDate();
      if (!lastActiveDate) return;

      const now = new Date();
      const diffHours = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);

      if (diffHours >= 8) {
        // Check if we already sent a notification recently
        const lastNotif = notifications[0];
        const lastNotifTime = lastNotif?.createdAt?.toDate();
        const hoursSinceLastNotif = lastNotifTime ? (now.getTime() - lastNotifTime.getTime()) / (1000 * 60 * 60) : 9;

        if (hoursSinceLastNotif >= 8) {
          await addDoc(collection(db, 'notifications'), {
            userId: user.uid,
            title: 'We miss you!',
            message: "It's been over 8 hours since your last activity. Come back and maintain your streak!",
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    };

    const interval = setInterval(checkInactivity, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(interval);
  }, [user, streak, notifications]);

  const updateStreak = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const streakRef = doc(db, 'streaks', user.uid);
    const streakDoc = await getDoc(streakRef);

    if (streakDoc.exists()) {
      const data = streakDoc.data() as StreakData;
      const lastActiveDate = data.lastActive?.toDate();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (data.history.includes(today)) return; // Already active today

      let newStreak = data.currentStreak;
      const lastActiveStr = lastActiveDate?.toISOString().split('T')[0];

      if (lastActiveStr === yesterdayStr) {
        newStreak += 1;
      } else if (lastActiveStr !== today) {
        newStreak = 1;
      }

      await updateDoc(streakRef, {
        currentStreak: newStreak,
        lastActive: serverTimestamp(),
        history: arrayUnion(today),
      });
    } else {
      await setDoc(streakRef, {
        currentStreak: 1,
        lastActive: serverTimestamp(),
        history: [today],
      });
    }
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <StreakContext.Provider value={{ streak, notifications, unreadCount, markAsRead, updateStreak }}>
      {children}
    </StreakContext.Provider>
  );
};
