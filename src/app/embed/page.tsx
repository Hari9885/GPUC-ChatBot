'use client';

import { useEffect } from 'react';
import ChatWidget from '@/components/ChatWidget';

export default function EmbedChatPage() {
  useEffect(() => {
    document.body.classList.add('is-embedded-body');
    return () => document.body.classList.remove('is-embedded-body');
  }, []);

  return <ChatWidget initialEmbedded={true} />;
}

