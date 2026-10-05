import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';
import type { FirebaseConfigStatus, AuthUser } from '../types/auth';

// Read Firebase config from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// Check if critical credentials are provided
export const getFirebaseConfigStatus = (): FirebaseConfigStatus => {
  const missingKeys: string[] = [];
  if (!firebaseConfig.apiKey) missingKeys.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingKeys.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.appId) missingKeys.push('VITE_FIREBASE_APP_ID');

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
};

const status = getFirebaseConfigStatus();

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (status.isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization warning:', error);
  }
}

// Provider instances
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('public_repo');

// GitLab OIDC Provider for Firebase Authentication
// Provider configured in Firebase Authentication as 'oidc.gitlab'
const gitlabProviderId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_GITLAB_PROVIDER_ID) || 'oidc.gitlab';

export const createGitlabProvider = (providerId: string = gitlabProviderId): OAuthProvider => {
  const provider = new OAuthProvider(providerId);
  // Standard OIDC scopes supported by default GitLab OAuth applications
  provider.addScope('openid');
  provider.addScope('profile');
  provider.addScope('email');
  return provider;
};

export const gitlabProvider = createGitlabProvider();

export { auth };

/**
 * Sign in with Google (Firebase)
 */
export const signInWithGoogle = async (): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return formatFirebaseUser(result.user, 'google.com');
};

/**
 * Sign in with a Google One Tap ID token (Google Identity Services).
 * GIS returns a JWT ID token; we exchange it for a Firebase session.
 * The existing "Continue with Google" popup stays as fallback for cases
 * where One Tap doesn't display (signed out of Google, FedCM blocked,
 * cooldown, unauthorized origin).
 */
export const signInWithGoogleIdToken = async (idToken: string): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return formatFirebaseUser(result.user, 'google.com');
};

/**
 * Sign in with GitHub (Firebase)
 */
export const signInWithGithub = async (): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const result = await signInWithPopup(auth, githubProvider);
  return formatFirebaseUser(result.user, 'github.com');
};

/**
 * Sign in with GitLab (Firebase OIDC Provider)
 * Uses standard OpenID Connect scopes (openid, profile, email) to guarantee first-try success.
 */
export const signInWithGitlab = async (): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  const provider = createGitlabProvider();
  const result = await signInWithPopup(auth, provider);
  return formatFirebaseUser(result.user, 'gitlab.com');
};

/**
 * Sign out of current Firebase session
 */
export const logoutUser = async (): Promise<void> => {
  if (auth) {
    await firebaseSignOut(auth);
  }
};

/**
 * Listen to Firebase Auth state changes
 */
export const subscribeToAuthChanges = (callback: (user: AuthUser | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      callback(formatFirebaseUser(firebaseUser, firebaseUser.providerData[0]?.providerId || 'password'));
    } else {
      callback(null);
    }
  });
};

const formatFirebaseUser = (user: User, providerId: string): AuthUser => ({
  uid: user.uid,
  displayName: user.displayName || user.email?.split('@')[0] || 'User',
  email: user.email,
  photoURL: user.photoURL,
  providerId,
});
