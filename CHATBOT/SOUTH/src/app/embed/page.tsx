'use client';

import { useEffect } from 'react';
import ChatWidget from '@/components/ChatWidget';

export default function EmbedChatPage() {
  useEffect(() => {
    document.documentElement.classList.add('is-embedded-html');
    document.body.classList.add('is-embedded-body');
    return () => {
      document.documentElement.classList.remove('is-embedded-html');
      document.body.classList.remove('is-embedded-body');
    };
  }, []);

  return <ChatWidget initialEmbedded={true} />;
}

