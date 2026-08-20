'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface MetaPixelProps {
  pixelId: string | null;
  event: 'ViewContent' | 'InitiateCheckout' | 'AddPaymentInfo' | 'Purchase';
  value?: number;
  currency?: string;
}

export function MetaPixel({ pixelId, event, value, currency = 'BRL' }: MetaPixelProps) {
  useEffect(() => {
    if (!pixelId) return;

    // Aguarda o script carregar e a função fbq estar disponível
    const fireEvent = () => {
      if (typeof window !== 'undefined' && (window as any).fbq) {
        if (value !== undefined) {
          (window as any).fbq('track', event, { value, currency });
        } else {
          (window as any).fbq('track', event);
        }
      } else {
        // Tenta novamente em 500ms se o script ainda não carregou
        setTimeout(fireEvent, 500);
      }
    };

    fireEvent();
  }, [pixelId, event, value, currency]);

  if (!pixelId) return null;

  return (
    <>
      <Script
        id={`meta-pixel-${pixelId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
          `,
        }}
      />
    </>
  );
}
