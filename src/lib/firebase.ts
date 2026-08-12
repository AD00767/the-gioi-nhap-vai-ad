/**
 * Local Compatibility Module replacing Firebase SDK
 * All authentication & data storage is performed via LocalStorage Engine in localDb.ts
 */

import {
  getCurrentUser,
  loginUser,
  registerUser,
  setCurrentUserId,
  getAllUsers,
  getUserById,
  getAllCharacters,
  getCharacterById,
  getAllPrompts,
  getPromptById,
  getAllFeedbacks,
  getComments,
  getAllReports,
  getAllAuditLogs,
} from './localDb';

// Stub Firebase Auth & Firestore objects to avoid breaking old imports if any exist
export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (callback: any) => {
    const user = getCurrentUser();
    callback(user ? { uid: user.id, email: user.email, displayName: user.displayName, photoURL: user.avatar } : null);
    return () => {};
  },
};

export const db: any = {
  type: 'localDb_storage',
};

export const googleProvider = {};

/**
 * Simulated Google Sign-In or quick account login
 */
export const loginWithGoogle = async () => {
  // Check if admin user exists or create default Google account in localStorage
  let user = getCurrentUser();
  if (!user) {
    const users = getAllUsers();
    if (users.length > 0) {
      user = users[0];
      setCurrentUserId(user.id);
    } else {
      const reg = registerUser('nhuochy259@gmail.com', '123456', 'Google User', 'ADMIN', true);
      user = reg.user;
    }
  }

  const fUser = {
    uid: user.id,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.avatar,
  };

  return { user: fUser, backendData: user };
};

export const logout = async () => {
  setCurrentUserId(null);
};
