/**
 * Google One Tap (Google Identity Services) helper.
 *
 * Shows the pill-shaped "Continue as ..." prompt at the top-right.
 * On success GIS returns an ID token (JWT) which we exchange for a
 * Firebase session via signInWithCredential in lib/firebase.ts.
 *
 * Docs: https://developers.google.com/identity/gsi/web/guides/display-one-tap
 */

export interface GisCredentialResponse {
  credential?: string;
  select_by?: string;
}

export interface GisPromptMoment {
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
}

interface GisIdConfig {
  client_id: string;
  callback: (response: GisCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  use_fedcm_for_prompt?: boolean;
}

interface GisAccounts {
  id: {
    initialize: (config: GisIdConfig) => void;
    prompt: (callback?: (moment: GisPromptMoment) => void) => void;
    cancel: () => void;
  };
}

declare global {
  interface Window {
    google?: { accounts?: GisAccounts };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

let gisLoadPromise: Promise<void> | null = null;

export const getGoogleClientId = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) {
    return String((import.meta as any).env.VITE_GOOGLE_CLIENT_ID).trim();
  }
  return '';
};

const loadGisScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('NO_WINDOW'));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisLoadPromise) return gisLoadPromise;

  gisLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('GIS_LOAD_FAILED')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GIS_LOAD_FAILED'));
    document.head.appendChild(script);
  });

  return gisLoadPromise;
};

export interface ShowOneTapOptions {
  autoSelect?: boolean;
  cancelOnTapOutside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  onPrompt?: (moment: GisPromptMoment) => void;
}

/**
 * Display the One Tap prompt. Resolves with the ID token when the user
 * clicks "Continue as ...". Never rejects on dismiss — returns null so
 * callers can silently fall back to the regular popup button.
 *
 * NOTE: Google may not display the prompt at all (user signed out of
 * Google, third-party FedCM blocked, opt-out cookie, cooldown after
 * dismiss, or unauthorized origin). That's expected — keep the
 * "Continue with Google" popup button as fallback.
 */
export const showGoogleOneTap = async (
  onCredential: (idToken: string) => void,
  options: ShowOneTapOptions = {},
): Promise<string | null> => {
  const clientId = getGoogleClientId();
  if (!clientId) return null;

  try {
    await loadGisScript();
  } catch {
    return null;
  }

  const gis = window.google?.accounts?.id;
  if (!gis) return null;

  // Cancel any in-flight prompt before re-initializing (React StrictMode safe).
  try {
    gis.cancel();
  } catch {
    // ignore — nothing to cancel on first run
  }

  return new Promise<string | null>((resolve) => {
    let settled = false;
    const done = (value: string | null) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    gis.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) {
          onCredential(response.credential);
          done(response.credential);
        } else {
          done(null);
        }
      },
      auto_select: options.autoSelect ?? false,
      cancel_on_tap_outside: options.cancelOnTapOutside ?? true,
      context: options.context ?? 'signin',
      // Use the FedCM API where available (Chrome's third-party-cookie-less path).
      use_fedcm_for_prompt: true,
    });

    gis.prompt((moment) => {
      options.onPrompt?.(moment);
      // If Google decided not to show anything, unblock the caller so the
      // regular popup button remains the path forward.
      if (moment.isNotDisplayed() || moment.isSkippedMoment()) {
        done(null);
      }
      // Dismissed = user closed it; keep fallback button, don't treat as error.
      if (moment.isDismissedMoment()) {
        done(null);
      }
    });
  });
};

export const cancelGoogleOneTap = (): void => {
  try {
    window.google?.accounts?.id.cancel();
  } catch {
    // ignore — GIS not loaded yet
  }
};
