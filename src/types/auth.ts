export type OAuthProviderType = 'google' | 'github' | 'gitlab';

export type AuthFlowView = 
  | 'main' 
  | 'google-flow' 
  | 'github-flow' 
  | 'gitlab-flow' 
  | 'authenticated'
  | 'connect-engines'
  | 'gemini-key-flow'
  | 'generic-key-flow'
  | 'engines-ready';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: string;
}

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
}
