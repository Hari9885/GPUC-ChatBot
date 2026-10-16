'use client';

import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle2,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface GpucWebsiteProps {
  onOpenChatWithQuery?: (query: string) => void;
}

export default function GpucWebsite({ onOpenChatWithQuery }: GpucWebsiteProps) {
  return (
    <div style={{ background: '#060D19', color: '#F8FAFC', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      {/* Top Banner & Actual GPUC Website Image */}
      <section
        style={{
          width: '100%',
          background: '#0B1727',
          position: 'relative',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
          <img
            src="/gpuc_website_bg.jpg"
            alt="Gopalan Pre-University College Bengaluru - Official Portal"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'cover',
            }}
          />
        </div>
      </section>

      {/* College Combinations & Direct Access Bar */}
      <section style={{ padding: '48px 20px', background: '#0B1727', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '32px' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} /> Official Admissions Desk 2026–27
              </span>
              <h2 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 800 }}>
                Karnataka PU Board Recognized Programs
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => onOpenChatWithQuery?.('What combinations are offered?')}
                className="btn-primary"
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              >
                <span>Ask AI About Admissions</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Science Card */}
            <div className="glass-panel" style={{ padding: '28px', borderTop: '3px solid #3B82F6' }}>
              <span className="badge badge-blue" style={{ marginBottom: '12px' }}>
                Science Stream
              </span>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '10px' }}>
                Engineering &amp; Medical Foundations
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#94A3B8', marginBottom: '18px', lineHeight: 1.5 }}>
                Integrated laboratory training with state-of-the-art facilities and analytical faculty mentorship.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#3B82F6" />
                  <span><strong>PCMB:</strong> Physics, Chemistry, Mathematics, Biology</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#3B82F6" />
                  <span><strong>PCMC:</strong> Physics, Chemistry, Mathematics, Computer Science</span>
                </div>
              </div>
              <button
                onClick={() => onOpenChatWithQuery?.('Tell me more about the Science stream combinations')}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.86rem' }}
              >
                Inquire About Science
              </button>
            </div>

            {/* Commerce Card */}
            <div className="glass-panel" style={{ padding: '28px', borderTop: '3px solid #F59E0B' }}>
              <span className="badge badge-gold" style={{ marginBottom: '12px' }}>
                Commerce Stream
              </span>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '10px' }}>
                Business, Finance &amp; Analytics
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#94A3B8', marginBottom: '18px', lineHeight: 1.5 }}>
                Rigorous foundations in accounting, statistics, economics, and CA Foundation coaching.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#F59E0B" />
                  <span><strong>CEBA:</strong> Computer Science, Economics, Business Studies, Accountancy</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#F59E0B" />
                  <span><strong>SEBA:</strong> Statistics, Economics, Business Studies, Accountancy</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#F59E0B" />
                  <span><strong>MEBA:</strong> Mathematics, Economics, Business Studies, Accountancy</span>
                </div>
              </div>
              <button
                onClick={() => onOpenChatWithQuery?.('Tell me more about the Commerce stream combinations')}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.86rem' }}
              >
                Inquire About Commerce
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Location & Footer */}
      <footer id="contact" style={{ padding: '40px 20px', background: '#040810' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: '28px',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>
              GOPALAN PRE-UNIVERSITY COLLEGE
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', maxWidth: '460px', lineHeight: 1.5, marginBottom: '12px' }}>
              <strong>North Campus (Yelahanka):</strong> No. 79, Mavallipura Kondashettihalli Road, Hesaragatta Hobli, Yelahanka, Bengaluru – 560089.
            </p>
            <div style={{ fontSize: '0.82rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>Admissions & Enquiry Help Desk: +91 81053 88193 / +91 81230 40418 / +91 96320 70209</span>
              <span>Email: gpuc.north@gopalanpucollege.com</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '12px' }}>Quick Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <button
                onClick={() => onOpenChatWithQuery?.('What is the admission eligibility for 2026?')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', textAlign: 'left', cursor: 'pointer' }}
              >
                &bull; Admission Eligibility 2026–27
              </button>
              <button
                onClick={() => onOpenChatWithQuery?.('Which documents are needed for admission?')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', textAlign: 'left', cursor: 'pointer' }}
              >
                &bull; Required Documents Checklist
              </button>
              <button
                onClick={() => onOpenChatWithQuery?.('How can I book a campus visit?')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', textAlign: 'left', cursor: 'pointer' }}
              >
                &bull; Schedule Campus Visit / Consultation
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: '1200px',
            margin: '28px auto 0',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#64748B',
          }}
        >
          &copy; 2026 Gopalan Pre-University College. Part of Gopalan Group of Institutions. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
