import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
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
// Supports custom provider ID (e.g. 'oidc.gitlab' or 'gitlab.com')
const gitlabProviderId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_GITLAB_PROVIDER_ID) || 'oidc.gitlab';
export const gitlabProvider = new OAuthProvider(gitlabProviderId);
gitlabProvider.addScope('openid');
gitlabProvider.addScope('profile');
gitlabProvider.addScope('email');
gitlabProvider.addScope('read_user');
gitlabProvider.addScope('read_repository');
gitlabProvider.addScope('read_api');

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
 */
export const signInWithGitlab = async (): Promise<AuthUser> => {
  if (!auth) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }

  // Candidate provider IDs commonly configured in Firebase Console for GitLab OIDC
  const candidateIds = [
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_GITLAB_PROVIDER_ID) || 'oidc.gitlab',
    'oidc.gitlab.com',
    'gitlab.com',
    'gitlab'
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: any = null;

  for (const providerId of candidateIds) {
    try {
      const provider = new OAuthProvider(providerId);
      provider.addScope('openid');
      provider.addScope('profile');
      provider.addScope('email');
      provider.addScope('read_user');
      provider.addScope('read_api');
      const result = await signInWithPopup(auth, provider);
      return formatFirebaseUser(result.user, 'gitlab.com');
    } catch (err: any) {
      lastError = err;
      // If error indicates provider not registered with this ID, try next candidate
      if (
        err?.code === 'auth/operation-not-allowed' || 
        err?.code === 'auth/invalid-provider-id' || 
        err?.code === 'auth/configuration-not-found'
      ) {
        continue;
      }
      // If user closed popup, canceled, or other real error, stop immediately
      throw err;
    }
  }

  throw lastError || new Error('GitLab OIDC provider not found. Please ensure the provider in Firebase Authentication is named "oidc.gitlab".');
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
