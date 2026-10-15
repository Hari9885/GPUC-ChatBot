'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  Phone,
  Search,
  Filter,
  Download,
  RefreshCw,
  Building2,
  ArrowUpRight,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  mobile: string;
  userType?: string;
  courseInterest?: string;
  intendedYear?: string;
  category?: string;
  summary: string;
  assignedTeam: string;
  assignedStaff?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface Appointment {
  id: string;
  inquiryId?: string;
  name: string;
  mobile: string;
  mode: 'campus_visit' | 'online_meeting';
  date: string;
  timeSlot: string;
  purpose: string;
  assignedStaff?: string;
  assignedDepartment?: string;
  status: string;
  meetingLinkOrVenue?: string;
  createdAt?: string;
}

interface FeedbackItem {
  id: string;
  inquiryId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'appointments' | 'feedback' | 'architecture'>('inquiries');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [avgRating, setAvgRating] = useState('5.0');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inqRes, aptRes, fbRes] = await Promise.all([
        fetch('/api/inquiries'),
        fetch('/api/appointments'),
        fetch('/api/feedback'),
      ]);

      const [inqData, aptData, fbData] = await Promise.all([
        inqRes.json(),
        aptRes.json(),
        fbRes.json(),
      ]);

      setInquiries(inqData.inquiries || []);
      setAppointments(aptData.appointments || []);
      setFeedback(fbData.feedback || []);
      setAvgRating(fbData.averageRating || '5.0');
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateInquiryStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateAppointmentStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const exportInquiriesCSV = () => {
    if (inquiries.length === 0) return;
    const headers = ['Inquiry ID', 'Name', 'Mobile', 'Course / Stream', 'Status', 'Summary', 'Created At'];
    const rows = inquiries.map((i) => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.mobile}"`,
      `"${i.courseInterest || ''}"`,
      i.status,
      `"${i.summary.replace(/"/g, '""')}"`,
      new Date(i.createdAt).toLocaleString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GPUC_North_Inquiries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInquiries = inquiries.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobile.includes(searchQuery) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const newLeadsCount = inquiries.filter((i) => i.status === 'NEW').length;
  const confirmedVisitsCount = appointments.filter((a) => a.mode === 'campus_visit').length;
  const onlineConsultationsCount = appointments.filter((a) => a.mode === 'online_meeting').length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Banner & Header */}
      <header
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
          color: '#FFFFFF',
          padding: '20px 32px',
          borderBottom: '3px solid #D97706',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: '#FFFFFF',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              }}
            >
              <img src="/gopalan_crest.svg" alt="GPUC Crest" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  GOPALAN PRE-UNIVERSITY COLLEGE
                </h1>
                <span
                  style={{
                    background: '#D97706',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  North Campus • Yelahanka
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#93C5FD', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={13} /> Admissions Department CRM &amp; AI Chatbot Response Gateway
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#D97706',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)',
              }}
            >
              Open Live Widget <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' }}>
        {/* KPI Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          {/* Card 1: Total Inquiries */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                Total Student Leads
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E3A8A', marginTop: '4px' }}>
                {inquiries.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: newLeadsCount > 0 ? '#DC2626' : '#16A34A', fontWeight: 700, marginTop: '4px' }}>
                {newLeadsCount} new pending action
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Users size={24} />
            </div>
          </div>

          {/* Card 2: Campus Visits Booked */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                North Campus Visits
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
                {confirmedVisitsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                Yelahanka offline campus tour
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Building2 size={24} />
            </div>
          </div>

          {/* Card 3: Online Consultations */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                Online Consultations
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {onlineConsultationsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                Counselor virtual sessions
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Calendar size={24} />
            </div>
          </div>

          {/* Card 4: Chatbot Quality & Satisfaction */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                Satisfaction Rating
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7C3AED', marginTop: '4px' }}>
                {avgRating} <span style={{ fontSize: '1.1rem', color: '#F59E0B' }}>★</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                From {feedback.length} parent reviews
              </div>
            </div>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <Star size={24} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '2px solid #E2E8F0',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={() => setActiveTab('inquiries')}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'inquiries' ? '3px solid #1E3A8A' : '3px solid transparent',
              color: activeTab === 'inquiries' ? '#1E3A8A' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Users size={16} /> Student Inquiries &amp; Leads ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'appointments' ? '3px solid #1E3A8A' : '3px solid transparent',
              color: activeTab === 'appointments' ? '#1E3A8A' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Calendar size={16} /> Campus Visits &amp; Slots ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'feedback' ? '3px solid #1E3A8A' : '3px solid transparent',
              color: activeTab === 'feedback' ? '#1E3A8A' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Star size={16} /> Feedback &amp; Ratings ({feedback.length})
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'architecture' ? '3px solid #1E3A8A' : '3px solid transparent',
              color: activeTab === 'architecture' ? '#1E3A8A' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={16} /> Architecture &amp; Data Pipeline
          </button>
        </div>

        {/* Tab 1: Inquiries / CRM Leads */}
        {activeTab === 'inquiries' && (
          <div>
            {/* Search and Filters Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student, mobile, inquiry ID..."
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={15} color="#64748B" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.85rem',
                      background: '#FFFFFF',
                      color: '#334155',
                      fontWeight: 600,
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <button
                onClick={exportInquiriesCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#1E3A8A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(30, 58, 138, 0.25)',
                }}
              >
                <Download size={14} /> Export Leads (CSV)
              </button>
            </div>

            {/* Inquiries Table */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 16px' }}>Lead Ref &amp; Time</th>
                      <th style={{ padding: '12px 16px' }}>Student &amp; Parent</th>
                      <th style={{ padding: '12px 16px' }}>Mobile Contact</th>
                      <th style={{ padding: '12px 16px' }}>Target Class / Stream</th>
                      <th style={{ padding: '12px 16px' }}>Chatbot Notes / Summary</th>
                      <th style={{ padding: '12px 16px' }}>Status &amp; Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInquiries.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                          No inquiries found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredInquiries.map((inq) => {
                        const isNew = inq.status === 'NEW';
                        return (
                          <tr
                            key={inq.id}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              background: isNew ? 'rgba(254, 243, 199, 0.3)' : 'transparent',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                              <span style={{ fontWeight: 700, color: '#1E3A8A', display: 'block' }}>{inq.id}</span>
                              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: '#0F172A' }}>{inq.name}</div>
                              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                Assigned: {inq.assignedTeam}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                              <a
                                href={`tel:${inq.mobile}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  color: '#2563EB',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                <Phone size={12} /> {inq.mobile}
                              </a>
                            </td>
                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                              <span
                                style={{
                                  background: '#EFF6FF',
                                  color: '#1E40AF',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                {inq.courseInterest || '12th Class (2nd PU)'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', verticalAlign: 'top', maxWidth: '360px' }}>
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  color: '#334155',
                                  lineHeight: 1.4,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                                title={inq.summary}
                              >
                                {inq.summary}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                              <select
                                value={inq.status}
                                disabled={updatingId === inq.id}
                                onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  border: '1px solid #CBD5E1',
                                  background:
                                    inq.status === 'NEW'
                                      ? '#FEF3C7'
                                      : inq.status === 'CONTACTED'
                                      ? '#DBEAFE'
                                      : inq.status === 'RESOLVED'
                                      ? '#DCFCE7'
                                      : '#F1F5F9',
                                  color:
                                    inq.status === 'NEW'
                                      ? '#92400E'
                                      : inq.status === 'CONTACTED'
                                      ? '#1E40AF'
                                      : inq.status === 'RESOLVED'
                                      ? '#166534'
                                      : '#475569',
                                  cursor: 'pointer',
                                }}
                              >
                                <option value="NEW">NEW</option>
                                <option value="CONTACTED">CONTACTED</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="RESOLVED">RESOLVED</option>
                                <option value="CLOSED">CLOSED</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Appointments / Visits */}
        {activeTab === 'appointments' && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                  Scheduled Campus Visits &amp; Online Appointments
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                  All offline visits automatically assigned to Gopalan PU College North Campus Admissions Desk
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 16px' }}>Ticket Ref</th>
                    <th style={{ padding: '12px 16px' }}>Visitor Name</th>
                    <th style={{ padding: '12px 16px' }}>Mobile</th>
                    <th style={{ padding: '12px 16px' }}>Type &amp; Schedule</th>
                    <th style={{ padding: '12px 16px' }}>Venue / Location</th>
                    <th style={{ padding: '12px 16px' }}>Purpose</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                        No campus visits booked yet.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1E3A8A' }}>{apt.id}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{apt.name}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <a href={`tel:${apt.mobile}`} style={{ color: '#2563EB', textDecoration: 'none' }}>
                            {apt.mobile}
                          </a>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: apt.mode === 'campus_visit' ? '#B45309' : '#059669' }}>
                            {apt.mode === 'campus_visit' ? '🏫 North Campus Visit' : '💻 Online Consultation'}
                          </div>
                          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                            {apt.date} • {apt.timeSlot}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', maxWidth: '280px', fontSize: '0.78rem', color: '#334155' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                            <MapPin size={13} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{apt.meetingLinkOrVenue || 'North Campus, Yelahanka'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#475569' }}>
                          {apt.purpose}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <select
                            value={apt.status}
                            disabled={updatingId === apt.id}
                            onChange={(e) => handleUpdateAppointmentStatus(apt.id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              border: '1px solid #CBD5E1',
                              background: apt.status === 'CONFIRMED' ? '#DCFCE7' : '#F1F5F9',
                              color: apt.status === 'CONFIRMED' ? '#166534' : '#475569',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="RESCHEDULED">RESCHEDULED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Feedback & Ratings */}
        {activeTab === 'feedback' && (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                Parent &amp; Student Chatbot Experience Ratings
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                Aggregated from the feedback modal when users close or rate the assistant session
              </p>
            </div>

            <div style={{ padding: '20px' }}>
              {feedback.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                  No feedback reviews received yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                  {feedback.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        padding: '16px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ color: '#F59E0B', fontSize: '1rem', display: 'flex', gap: '2px' }}>
                          {'★'.repeat(f.rating)}
                          {'☆'.repeat(5 - f.rating)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          {new Date(f.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155', fontStyle: f.comment ? 'normal' : 'italic' }}>
                        {f.comment || 'User gave a star rating without textual feedback.'}
                      </p>
                      {f.inquiryId && (
                        <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#64748B' }}>
                          Linked Inquiry: <span style={{ fontWeight: 600, color: '#1E3A8A' }}>{f.inquiryId}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Architecture & End-to-End Reflection */}
        {activeTab === 'architecture' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.05rem', fontWeight: 800, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#2563EB" /> How Responses Are Stored &amp; Reflected to Administration
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                Every interaction across the Gopalan PU College North Campus website widget seamlessly cascades through a structured, multi-tier data pipeline:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Step 1 */}
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1E3A8A', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      1
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Lead &amp; Student Inquiries</strong>
                  </div>
                  <p style={{ fontSize: '0.80rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    When a student or parent provides their name, phone number, and class stream in the chatbot flow, it executes a <code>POST /api/inquiries</code> request. This generates a unique tracking ID (e.g. <code>GPUC-2026-INQ-1001</code>) and stores the inquiry into <code>data/db.json</code> under the <code>inquiries</code> array with status <code>NEW</code>.
                  </p>
                </div>

                {/* Step 2 */}
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#D97706', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      2
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Campus Visits &amp; Tickets</strong>
                  </div>
                  <p style={{ fontSize: '0.80rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    When a campus visit is confirmed, a <code>POST /api/appointments</code> request generates a visit ticket (e.g. <code>GPUC-VISIT-2026-501</code>). The venue is automatically populated with North Campus (Yelahanka), visiting hours (8:30 AM – 5:00 PM), and contact desk phone numbers. An automated confirmation notification is recorded in <code>messages</code>.
                  </p>
                </div>

                {/* Step 3 */}
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#059669', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      3
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Real-Time Admin Reflection</strong>
                  </div>
                  <p style={{ fontSize: '0.80rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    Admissions officers access this live Admin Portal (<code>/admin</code>). New leads can be sorted, filtered by class/stream, and clicked to trigger direct phone calls. Counselors update status from <code>NEW</code> to <code>CONTACTED</code> or <code>RESOLVED</code> via <code>PATCH /api/inquiries</code>, updating the database in real time.
                  </p>
                </div>

                {/* Step 4 */}
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#7C3AED', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      4
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>Export &amp; Reporting</strong>
                  </div>
                  <p style={{ fontSize: '0.80rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    With a single click on <strong>Export Leads (CSV)</strong>, the administration department can download full inquiry reports formatted for Excel or Google Sheets, including student names, parent info, mobile contacts, course interests, and timestamps for administrative reviews.
                  </p>
                </div>
              </div>
            </div>

            {/* Verified North Campus Facts Summary */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                Verified North Campus Operational Parameters
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '0.84rem' }}>
                <div style={{ padding: '12px 14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1E3A8A' }}>Campus Name</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>Gopalan Pre-University College, North Campus (Yelahanka)</div>
                </div>
                <div style={{ padding: '12px 14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1E3A8A' }}>Leadership</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>Principal: Mr. M. Mahesh | Director: Mrs. Sunita Prabhakar</div>
                </div>
                <div style={{ padding: '12px 14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1E3A8A' }}>Location &amp; Address</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>No. 79, Mavallipura Kondashettihalli Road, Hesaragatta Hobli, Yelahanka, Bengaluru 560089</div>
                </div>
                <div style={{ padding: '12px 14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1E3A8A' }}>Admissions Desk Helpline</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>+91 81053 88193 / +91 81230 40418 / +91 96320 70209</div>
                </div>
                <div style={{ padding: '12px 14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1E3A8A' }}>Science Stream</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>PCMB &amp; PCMC (with integrated NEET, JEE &amp; KCET coaching)</div>
                </div>
                <div style={{ padding: '12px 14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1E3A8A' }}>Commerce Stream</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>CEBA (Computer Science, Economics, Business Studies, Accountancy)</div>
                </div>
                <div style={{ padding: '12px 14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1E3A8A' }}>Languages</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>Part I: English (Mandatory) | Part II: Kannada or Hindi</div>
                </div>
                <div style={{ padding: '12px 14px', background: '#F1F5F9', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1E3A8A' }}>Visiting / Office Hours</div>
                  <div style={{ color: '#334155', marginTop: '2px' }}>Monday &ndash; Saturday, 8:30 AM &ndash; 5:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
