import { useMemo } from 'react';
import {
  GoogleReCaptchaProvider,
  GoogleReCaptchaContext,
} from 'react-google-recaptcha-v3';

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
  const fallbackValue = useMemo(
    () => ({ executeRecaptcha: undefined, container: containerElement }),
    [containerElement]
  );

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
