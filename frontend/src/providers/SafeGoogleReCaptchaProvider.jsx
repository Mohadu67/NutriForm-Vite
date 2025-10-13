import { useMemo } from 'react';
import {
  GoogleReCaptchaProvider,
  GoogleReCaptchaContext,
} from 'react-google-recaptcha-v3';

const RECAPTCHA_ENABLED = import.meta.env.VITE_ENABLE_RECAPTCHA !== 'false' && import.meta.env.VITE_ENABLE_RECAPTCHA !== '0';

export default function SafeGoogleReCaptchaProvider({
  reCaptchaKey,
  children,
  scriptProps,
  useEnterprise,
  useRecaptchaNet,
  language,
  container,
}) {
  const containerElement = container?.element;
  const fallbackValue = useMemo(() => {
    const executeRecaptcha = async () => {
      if (RECAPTCHA_ENABLED && typeof window !== 'undefined' && !import.meta.env.PROD) {
        
        console.warn('[SafeGoogleReCaptchaProvider] Aucun reCAPTCHA key détecté. Le fallback renvoie un token vide.');
      }
      return null;
    };

    return { executeRecaptcha, container: containerElement };
  }, [containerElement]);

  if (!RECAPTCHA_ENABLED) {
    return (
      <GoogleReCaptchaContext.Provider value={fallbackValue}>
        {children}
      </GoogleReCaptchaContext.Provider>
    );
  }

  if (!reCaptchaKey) {
    return (
      <GoogleReCaptchaContext.Provider value={fallbackValue}>
        {children}
      </GoogleReCaptchaContext.Provider>
    );
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={reCaptchaKey}
      scriptProps={scriptProps}
      useEnterprise={useEnterprise}
      useRecaptchaNet={useRecaptchaNet}
      language={language}
      container={container}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
