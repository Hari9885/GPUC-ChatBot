'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function GlobalChatLoader() {
  const pathname = usePathname();

  useEffect(() => {
    // Normalize pathname
    const cleanPath = (pathname || '').split('?')[0].replace(/\/+$/, '') || '/';

    // Skip root page if page.tsx already renders the ChatWidget directly, or inside iframe embed
    if (cleanPath === '/' || cleanPath === '/embed') {
      return;
    }

    // Check if embed script is already loaded
    if (document.getElementById('gpuc-global-chatbot-script')) {
      return;
    }

    (window as any).GPUC_CHATBOT_URL = window.location.origin;

    const script = document.createElement('script');
    script.id = 'gpuc-global-chatbot-script';
    script.src = `${window.location.origin}/gpuc-chatbot-embed.js?v=7`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup launcher if navigating back
      const launcher = document.getElementById('gpuc-widget-launcher');
      const container = document.getElementById('gpuc-widget-container');
      const tooltip = document.getElementById('gpuc-widget-tooltip');
      if (launcher) launcher.remove();
      if (container) container.remove();
      if (tooltip) tooltip.remove();
      const existingScript = document.getElementById('gpuc-global-chatbot-script');
      if (existingScript) existingScript.remove();
    };
  }, [pathname]);

  return null;
}
