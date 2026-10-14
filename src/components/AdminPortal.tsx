'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  PhoneCall,
  Building,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  mobile: string;
  userType?: string;
  courseInterest?: string;
  category: string;
  summary: string;
  assignedTeam: string;
  status: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  name: string;
  mobile: string;
  mode: string;
  date: string;
  timeSlot: string;
  purpose: string;
  assignedDepartment: string;
  status: string;
  meetingLinkOrVenue: string;
}

interface FeedbackData {
  feedback: Array<{ id: string; rating: number; comment?: string; createdAt: string }>;
  averageRating: string;
  totalCount: number;
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'appointments' | 'feedback'>('inquiries');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inqRes, aptRes, fbRes] = await Promise.all([
        fetch(`/api/inquiries?department=${departmentFilter}&status=${statusFilter}`),
        fetch('/api/appointments'),
        fetch('/api/feedback'),
      ]);

      const inqData = await inqRes.json();
      const aptData = await aptRes.json();
      const fbData = await fbRes.json();

      setInquiries(inqData.inquiries || []);
      setAppointments(aptData.appointments || []);
      setFeedbackData(fbData);
    } catch (err) {
      console.error('Failed to load portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departmentFilter, statusFilter]);

  const updateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchData();
    } catch (err) {
      console.error('Error updating inquiry status:', err);
    }
  };

  const filteredInquiries = inquiries.filter((i) => {
    const q = searchQuery.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.mobile.includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Banner & Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-gold">Staff Operations Console</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>GPUC Administrative Portal</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Admissions & Inquiries Operations</h1>
        </div>

        <button onClick={fetchData} className="btn-secondary" style={{ padding: '8px 16px' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Records
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Inquiries</span>
            <Users size={20} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>{inquiries.length}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold-light)', marginTop: '4px' }}>
            Live Student & Parent Leads
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Appointments Booked</span>
            <Calendar size={20} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>{appointments.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#60a5fa', marginTop: '4px' }}>
            Campus Visits & Online Meets
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Admissions Queue</span>
            <Building size={20} color="#22c55e" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>
            {inquiries.filter((i) => i.assignedTeam === 'Admissions').length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#4ade80', marginTop: '4px' }}>
            Active Course Guidance
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Parent Satisfaction</span>
            <Star size={20} color="#eab308" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>
            {feedbackData?.averageRating || '5.0'} / 5.0
          </div>
          <div style={{ fontSize: '0.78rem', color: '#fef08a', marginTop: '4px' }}>
            Based on {feedbackData?.totalCount || 0} reviews
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setActiveTab('inquiries')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'inquiries' ? '2px solid var(--accent-gold)' : '2px solid transparent',
            color: activeTab === 'inquiries' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Inquiries & Leads Queue ({inquiries.length})
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'appointments' ? '2px solid var(--accent-gold)' : '2px solid transparent',
            color: activeTab === 'appointments' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Appointment Schedule ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'feedback' ? '2px solid var(--accent-gold)' : '2px solid transparent',
            color: activeTab === 'feedback' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Feedback & Ratings ({feedbackData?.totalCount || 0})
        </button>
      </div>

      {/* INQUIRIES VIEW */}
      {activeTab === 'inquiries' && (
        <div>
          {/* Controls bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.05)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                width: '320px',
                maxWidth: '100%',
              }}
            >
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search leads by name, phone, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Filter size={16} color="var(--text-muted)" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  background: 'rgba(15, 27, 46, 0.9)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                }}
              >
                <option value="All">All Departments</option>
                <option value="Admissions">Admissions</option>
                <option value="Accounts">Accounts</option>
                <option value="Academic Coordinator">Academic Coordinator</option>
                <option value="Administration">Administration</option>
                <option value="General Support">General Support</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: 'rgba(15, 27, 46, 0.9)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  fontSize: '0.85rem',
                }}
              >
                <option value="All">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="CONTACT_PENDING">CONTACT_PENDING</option>
                <option value="CONTACT_ATTEMPTED">CONTACT_ATTEMPTED</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
          </div>

          {/* Inquiries Table / Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredInquiries.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No inquiries match the selected criteria.
              </div>
            ) : (
              filteredInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="glass-panel"
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: '1 1 340px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="badge badge-gold">{inq.id}</span>
                      <span className="badge badge-blue">{inq.assignedTeam}</span>
                      <span
                        className="badge"
                        style={{
                          background: inq.status === 'RESOLVED' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                          color: inq.status === 'RESOLVED' ? '#4ade80' : '#fef08a',
                          border: `1px solid ${inq.status === 'RESOLVED' ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
                        }}
                      >
                        {inq.status}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginBottom: '4px' }}>
                      {inq.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>({inq.mobile})</span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <strong>Interest:</strong> {inq.courseInterest || 'General PUC'} &bull; <strong>Type:</strong> {inq.userType || 'Parent'}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {inq.summary}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Received: {new Date(inq.createdAt).toLocaleString()}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {inq.status !== 'CONTACT_ATTEMPTED' && (
                        <button
                          onClick={() => updateInquiryStatus(inq.id, 'CONTACT_ATTEMPTED')}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        >
                          <PhoneCall size={13} />
                          Attempted
                        </button>
                      )}
                      {inq.status !== 'RESOLVED' && (
                        <button
                          onClick={() => updateInquiryStatus(inq.id, 'RESOLVED')}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <CheckCircle2 size={13} />
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APPOINTMENTS VIEW */}
      {activeTab === 'appointments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {appointments.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No appointments scheduled yet.
            </div>
          ) : (
            appointments.map((apt) => (
              <div
                key={apt.id}
                className="glass-panel"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-gold">{apt.id}</span>
                    <span className="badge badge-purple">{apt.mode.replace('_', ' ').toUpperCase()}</span>
                    <span className="badge badge-green">{apt.status}</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                    {apt.name} &bull; {apt.mobile}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-gold)', fontWeight: 600, marginBottom: '6px' }}>
                    <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {apt.date} at {apt.timeSlot}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong>Purpose:</strong> {apt.purpose} &bull; <strong>Venue/Link:</strong> {apt.meetingLinkOrVenue}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FEEDBACK VIEW */}
      {activeTab === 'feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {feedbackData?.feedback.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No parent feedback submitted yet.
            </div>
          ) : (
            feedbackData?.feedback.map((fb) => (
              <div key={fb.id} className="glass-panel" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < fb.rating ? '#eab308' : 'none'}
                        color={i < fb.rating ? '#eab308' : '#64748b'}
                      />
                    ))}
                    <span style={{ marginLeft: '6px', fontWeight: 700, color: '#fff' }}>{fb.rating} / 5</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#e2e8f0', fontStyle: 'italic' }}>
                  &ldquo;{fb.comment || 'Helpful assistance.'}&rdquo;
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
