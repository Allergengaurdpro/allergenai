import React, { createContext, useState, useEffect, useContext } from 'react';
import { getLocalData, saveLocalData, STORAGE_KEYS, generateId } from '../config/mockData';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);

      // Get user profile
      const users = getLocalData(STORAGE_KEYS.USERS);
      const profile = users.find(u => u.id === user.uid);
      if (profile) {
        setUserProfile(profile);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const users = getLocalData(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const currentUserObj = {
      uid: user.id,
      email: user.email
    };

    setCurrentUser(currentUserObj);
    setUserProfile(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUserObj));

    return { user: currentUserObj };
  };

  const logout = async () => {
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  const signup = async (email, password, userData) => {
    const users = getLocalData(STORAGE_KEYS.USERS);

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUserId = generateId();
    const newUser = {
      id: newUserId,
      email,
      password,
      ...userData,
      createdAt: new Date().toISOString(),
      active: true
    };

    users.push(newUser);
    saveLocalData(STORAGE_KEYS.USERS, users);

    return {
      user: {
        uid: newUserId,
        email
      }
    };
  };

  const value = {
    currentUser,
    userProfile,
    login,
    logout,
    signup,
    isManager: userProfile?.role === 'manager',
    isReceiver: userProfile?.role === 'receiver'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
