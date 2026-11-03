import React, { useEffect, useRef } from 'react';

interface PhoneEmailButtonProps {
  clientId?: string;
  onSuccess: (userJsonUrl: string) => void;
}

declare global {
  interface Window {
    phoneEmailListener?: ((userObj: { user_json_url: string }) => void) | null;
  }
}

export const PhoneEmailButton: React.FC<PhoneEmailButtonProps> = ({
  clientId = '15695407177920574360',
  onSuccess,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.phoneEmailListener = function (userObj: { user_json_url: string }) {
      if (userObj?.user_json_url) {
        onSuccess(userObj.user_json_url);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://www.phone.email/sign_in_button_v1.js';
      script.async = true;
      container.appendChild(script);
    }

    return () => {
      window.phoneEmailListener = null;
    };
  }, [clientId, onSuccess]);

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
      <div
        ref={containerRef}
        className="pe_signin_button"
        data-client-id={clientId}
      ></div>
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 text-center">
        Official real-time SMS OTP verification powered by Phone.email
      </p>
    </div>
  );
};
