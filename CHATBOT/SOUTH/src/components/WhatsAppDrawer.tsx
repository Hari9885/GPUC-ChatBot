'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, X, CheckCheck, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  type: string;
  recipient: string;
  templateId: string;
  content: string;
  status: string;
  timestamp: string;
}

interface WhatsAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppDrawer({ isOpen, onClose }: WhatsAppDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        maxWidth: '100vw',
        background: '#0B141A',
        zIndex: 9999,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        fontFamily: 'var(--font-body)',
        animation: 'slideIn 0.25s ease-out',
        overscrollBehavior: 'contain',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* WhatsApp Header */}
      <div
        style={{
          background: '#1F2C34',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 800,
              fontSize: '1.1rem',
            }}
          >
            G
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#E9EDEF', fontSize: '0.98rem' }}>
              Gopalan PU College
            </div>
            <div style={{ fontSize: '0.78rem', color: '#25D366', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#25D366' }}></span>
              Official WhatsApp Business
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchMessages}
            title="Refresh messages"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696A0',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            title="Close Drawer"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8696A0',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Simulator Info Banner */}
      <div
        style={{
          background: 'rgba(37, 211, 102, 0.1)',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(37, 211, 102, 0.2)',
          fontSize: '0.78rem',
          color: '#8696A0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Smartphone size={16} color="#25D366" />
        <span>
          <strong>Live Parent Simulator:</strong> Messages dispatched via <code>send_approved_whatsapp_message</code> appear here instantly.
        </span>
      </div>

      {/* Messages Feed */}
      <div
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backgroundImage: 'radial-gradient(#182229 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              margin: 'auto',
              textAlign: 'center',
              color: '#8696A0',
              fontSize: '0.85rem',
              padding: '20px',
            }}
          >
            No WhatsApp messages dispatched yet. Register an inquiry or book an appointment in the assistant to see simulated WhatsApp templates delivered here.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: 'flex-start',
                maxWidth: '92%',
                background: '#005C4B',
                borderRadius: '10px',
                padding: '12px 14px',
                color: '#E9EDEF',
                fontSize: '0.86rem',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#25D366',
                  fontWeight: 700,
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Template: {msg.templateId}
              </div>
              <div>{msg.content}</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  marginTop: '6px',
                  fontSize: '0.7rem',
                  color: '#8696A0',
                }}
              >
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <CheckCheck size={14} color="#53BDEB" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* WhatsApp Footer */}
      <div
        style={{
          background: '#202C33',
          padding: '12px 16px',
          fontSize: '0.75rem',
          color: '#8696A0',
          textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        Verified Official Integration &bull; End-to-End Grounded
      </div>
    </div>
  );
}
