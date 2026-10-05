import { useEffect, useRef, useState } from 'react';
import {
  cancelGoogleOneTap,
  getGoogleClientId,
  showGoogleOneTap,
} from '../lib/googleOneTap';
import { getFirebaseConfigStatus, signInWithGoogleIdToken } from '../lib/firebase';
import type { AuthUser } from '../types/auth';

interface UseGoogleOneTapOptions {
  /** Only prompt when the user isn't signed in and is on a login view. */
  enabled: boolean;
  onSuccess: (user: AuthUser) => void;
  onError?: (message: string) => void;
}

interface UseGoogleOneTapResult {
  oneTapReady: boolean;
  oneTapError: string | null;
}

/**
 * Auto-displays the Google One Tap pill ("Continue as ...") top-right.
 * Silently does nothing when:
 * - Firebase or VITE_GOOGLE_CLIENT_ID isn't configured,
 * - Google chooses not to display (signed out, cooldown, FedCM blocked).
 * The regular popup button remains the fallback in all those cases.
 */
export const useGoogleOneTap = ({
  enabled,
  onSuccess,
  onError,
}: UseGoogleOneTapOptions): UseGoogleOneTapResult => {
  const [oneTapError, setOneTapError] = useState<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const configStatus = getFirebaseConfigStatus();
    if (!configStatus.isConfigured) return;
    if (!getGoogleClientId()) return;

    let cancelled = false;

    // Small delay so the page paints first — matches how other sites
    // pop One Tap in just after the login screen appears.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void showGoogleOneTap(
        async (idToken) => {
          if (cancelled) return;
          try {
            const user = await signInWithGoogleIdToken(idToken);
            cancelGoogleOneTap();
            onSuccessRef.current(user);
          } catch (err: any) {
            // FedCM / account mismatch errors land here — surface quietly
            // and leave the popup button as the way forward.
            const message =
              err?.code === 'auth/account-exists-with-different-credential'
                ? 'This email is already linked to another sign-in method. Use your original provider first.'
                : err?.message || 'Google One Tap sign-in failed. Try Continue with Google instead.';
            setOneTapError(message);
            onErrorRef.current?.(message);
          }
        },
        { context: 'signin', autoSelect: false },
      );
    }, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cancelGoogleOneTap();
    };
  }, [enabled]);

  return { oneTapReady: getGoogleClientId().length > 0, oneTapError };
};
