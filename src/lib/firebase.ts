import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { initializeFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Sync with Firestore directly if reachable
    let backendData;
    try {
      let hasAdmin = false;
      try {
        const adminQuery = query(collection(db, "users"), where("role", "==", "ADMIN"));
        const adminSnap = await getDocs(adminQuery);
        hasAdmin = !adminSnap.empty;
      } catch (err) {}

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        backendData = {
          email: user.email,
          displayName: user.displayName || "User " + user.uid.substring(0, 5),
          avatar: user.photoURL || "",
          bio: "",
          socialLinks: {},
          role: hasAdmin ? "USER" : "ADMIN", // Grant ADMIN to the first participant if no admin exists
          creatorStatus: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deletedAt: null
        };
        await setDoc(userRef, backendData).catch(() => {});
      } else {
        backendData = userSnap.data();
        // If no admin exists in system, auto-upgrade this user to ADMIN
        if (!hasAdmin && backendData.role !== "ADMIN") {
          backendData.role = "ADMIN";
          await updateDoc(userRef, { role: "ADMIN" }).catch(() => {});
        }
      }
    } catch (fsErr) {
      console.warn("Notice: Firestore sync skipped or quota limited during login, using Google auth profile fallback:", fsErr);
      backendData = {
        email: user.email,
        displayName: user.displayName || "User " + user.uid.substring(0, 5),
        avatar: user.photoURL || "",
        bio: "",
        socialLinks: {},
        role: "USER",
        creatorStatus: false
      };
    }
    
    return { user, backendData: { id: user.uid, ...backendData } };
  } catch (error: any) {
    if (error?.code === 'auth/network-request-failed') {
      console.warn("Notice: Auth network request failed (network or popup constraint):", error);
    } else {
      console.warn("Notice: Login error:", error);
    }
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

