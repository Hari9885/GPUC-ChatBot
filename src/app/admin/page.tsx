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
  GraduationCap,
  Receipt,
  Building,
  BookOpen,
  MessageCircle,
  X,
  Send,
  Eye,
  Layers,
  FileText,
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
  const [departmentFilter, setDepartmentFilter] = useState<'All' | 'Admissions' | 'Accounts' | 'Administration' | 'Academics'>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

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
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateInquiryDepartment = async (id: string, newDepartment: string) => {
    setUpdatingId(id);
    try {
      let defaultStaff = 'Mr. Aravind J (Admissions Officer)';
      if (newDepartment === 'Accounts') defaultStaff = 'Mrs. Kavitha N (Accountant)';
      else if (newDepartment === 'Administration') defaultStaff = 'Mr. Suresh Kumar (Administration Officer)';
      else if (newDepartment === 'Academics') defaultStaff = 'Mrs. Deepa R (Academic Coordinator)';

      const res = await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, assignedTeam: newDepartment, assignedStaff: defaultStaff }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, assignedTeam: newDepartment, assignedStaff: defaultStaff } : item))
        );
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry((prev) => (prev ? { ...prev, assignedTeam: newDepartment, assignedStaff: defaultStaff } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update inquiry department:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddNote = async (id: string) => {
    if (!newNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: newNoteText.trim() }),
      });
      if (res.ok) {
        const appendedSummary = ` | Note: ${newNoteText.trim()}`;
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, summary: item.summary + appendedSummary } : item))
        );
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry((prev) => (prev ? { ...prev, summary: prev.summary + appendedSummary } : null));
        }
        setNewNoteText('');
      }
    } catch (err) {
      console.error('Failed to append note:', err);
    } finally {
      setIsSavingNote(false);
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
    const listToExport = filteredInquiries;
    if (listToExport.length === 0) return;
    const headers = ['Inquiry ID', 'Name', 'Mobile', 'Department', 'Assigned Staff', 'Course / Stream', 'Status', 'Summary', 'Created At'];
    const rows = listToExport.map((i) => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.mobile}"`,
      `"${i.assignedTeam || 'Admissions'}"`,
      `"${i.assignedStaff || ''}"`,
      `"${i.courseInterest || ''}"`,
      i.status,
      `"${i.summary.replace(/"/g, '""')}"`,
      new Date(i.createdAt).toLocaleString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const deptTag = departmentFilter !== 'All' ? `_${departmentFilter}` : '';
    link.setAttribute('download', `GPUC_North${deptTag}_Inquiries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInquiries = inquiries.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobile.includes(searchQuery) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.assignedTeam && item.assignedTeam.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.assignedStaff && item.assignedStaff.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    let matchesDepartment = true;
    if (departmentFilter !== 'All') {
      const team = (item.assignedTeam || '').toLowerCase();
      if (departmentFilter === 'Accounts') {
        matchesDepartment = team.includes('account') || team.includes('fee');
      } else if (departmentFilter === 'Admissions') {
        matchesDepartment = team.includes('admission');
      } else if (departmentFilter === 'Administration') {
        matchesDepartment = team.includes('admin') && !team.includes('admission');
      } else if (departmentFilter === 'Academics') {
        matchesDepartment = team.includes('academic');
      }
    }

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const newLeadsCount = inquiries.filter((i) => i.status === 'NEW').length;
  const admissionsCount = inquiries.filter((i) => (i.assignedTeam || '').toLowerCase().includes('admission')).length;
  const accountsCount = inquiries.filter((i) => (i.assignedTeam || '').toLowerCase().includes('account') || (i.assignedTeam || '').toLowerCase().includes('fee')).length;
  const adminOpsCount = inquiries.filter((i) => (i.assignedTeam || '').toLowerCase().includes('admin') && !(i.assignedTeam || '').toLowerCase().includes('admission')).length;
  const academicsCount = inquiries.filter((i) => (i.assignedTeam || '').toLowerCase().includes('academic')).length;
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          {/* Card 1: Total Inquiries */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Leads
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E3A8A', marginTop: '2px' }}>
                {inquiries.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: newLeadsCount > 0 ? '#DC2626' : '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                {newLeadsCount} new uncontacted
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Users size={22} />
            </div>
          </div>

          {/* Card 2: Admissions Desk */}
          <div
            onClick={() => { setActiveTab('inquiries'); setDepartmentFilter('Admissions'); }}
            style={{
              background: '#FFFFFF',
              border: departmentFilter === 'Admissions' ? '2px solid #2563EB' : '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Admissions Desk
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E40AF', marginTop: '2px' }}>
                {admissionsCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                Course &amp; seat inquiries
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E40AF' }}>
              <GraduationCap size={22} />
            </div>
          </div>

          {/* Card 3: Accounts / Accountant Desk */}
          <div
            onClick={() => { setActiveTab('inquiries'); setDepartmentFilter('Accounts'); }}
            style={{
              background: '#FFFFFF',
              border: departmentFilter === 'Accounts' ? '2px solid #059669' : '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Accounts &amp; Fees Desk
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065F46', marginTop: '2px' }}>
                {accountsCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 600, marginTop: '2px' }}>
                Accountant fee inquiries
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Receipt size={22} />
            </div>
          </div>

          {/* Card 4: Campus Visits & Admin */}
          <div
            onClick={() => { setActiveTab('appointments'); }}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Campus Visits &amp; Admin
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B45309', marginTop: '2px' }}>
                {confirmedVisitsCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                Yelahanka offline tours
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Building2 size={22} />
            </div>
          </div>

          {/* Card 5: Chatbot Quality & Satisfaction */}
          <div
            onClick={() => { setActiveTab('feedback'); }}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Satisfaction Rating
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6D28D9', marginTop: '2px' }}>
                {avgRating} <span style={{ fontSize: '1.1rem', color: '#F59E0B' }}>★</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                {feedback.length} parent reviews
              </div>
            </div>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <Star size={22} />
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
            overflowX: 'auto',
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
              whiteSpace: 'nowrap',
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
              whiteSpace: 'nowrap',
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
              whiteSpace: 'nowrap',
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
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldCheck size={16} /> Architecture &amp; Data Pipeline
          </button>
        </div>

        {/* Tab 1: Inquiries / CRM Leads */}
        {activeTab === 'inquiries' && (
          <div>
            {/* Department Quick Filter Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '14px',
                padding: '10px 14px',
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '5px', marginRight: '6px' }}>
                <Layers size={14} /> Filter Department:
              </span>

              <button
                onClick={() => setDepartmentFilter('All')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: departmentFilter === 'All' ? '1.5px solid #1E3A8A' : '1px solid #CBD5E1',
                  background: departmentFilter === 'All' ? '#1E3A8A' : '#F8FAFC',
                  color: departmentFilter === 'All' ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                All Departments ({inquiries.length})
              </button>

              <button
                onClick={() => setDepartmentFilter('Admissions')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: departmentFilter === 'Admissions' ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                  background: departmentFilter === 'Admissions' ? '#2563EB' : '#F8FAFC',
                  color: departmentFilter === 'Admissions' ? '#FFFFFF' : '#1E40AF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <GraduationCap size={13} /> Admissions Desk ({admissionsCount})
              </button>

              <button
                onClick={() => setDepartmentFilter('Accounts')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: departmentFilter === 'Accounts' ? '1.5px solid #059669' : '1px solid #CBD5E1',
                  background: departmentFilter === 'Accounts' ? '#059669' : '#F8FAFC',
                  color: departmentFilter === 'Accounts' ? '#FFFFFF' : '#065F46',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Receipt size={13} /> Accounts (Accountant) ({accountsCount})
              </button>

              <button
                onClick={() => setDepartmentFilter('Administration')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: departmentFilter === 'Administration' ? '1.5px solid #7C3AED' : '1px solid #CBD5E1',
                  background: departmentFilter === 'Administration' ? '#7C3AED' : '#F8FAFC',
                  color: departmentFilter === 'Administration' ? '#FFFFFF' : '#6D28D9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Building size={13} /> Administration &amp; Visits ({adminOpsCount})
              </button>

              <button
                onClick={() => setDepartmentFilter('Academics')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: departmentFilter === 'Academics' ? '1.5px solid #D97706' : '1px solid #CBD5E1',
                  background: departmentFilter === 'Academics' ? '#D97706' : '#F8FAFC',
                  color: departmentFilter === 'Academics' ? '#FFFFFF' : '#B45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
              >
                <BookOpen size={13} /> Academics &amp; Coaching ({academicsCount})
              </button>
            </div>

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
                    placeholder="Search student, mobile, inquiry ID, notes..."
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
                <Download size={14} /> Export {departmentFilter !== 'All' ? `${departmentFilter} ` : ''}Leads (CSV)
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
                    <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 14px' }}>Lead Ref &amp; Time</th>
                      <th style={{ padding: '12px 14px' }}>Student &amp; Parent</th>
                      <th style={{ padding: '12px 14px' }}>Department &amp; Incharge</th>
                      <th style={{ padding: '12px 14px' }}>Contact &amp; WhatsApp</th>
                      <th style={{ padding: '12px 14px' }}>Target Stream</th>
                      <th style={{ padding: '12px 14px' }}>Chatbot Inputs / Summary</th>
                      <th style={{ padding: '12px 14px' }}>Status &amp; Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInquiries.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                          No inquiries found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredInquiries.map((inq) => {
                        const isNew = inq.status === 'NEW';
                        const dept = (inq.assignedTeam || 'Admissions');
                        const isAccounts = dept.toLowerCase().includes('account') || dept.toLowerCase().includes('fee');
                        const isAdmissions = dept.toLowerCase().includes('admission');
                        const isAdministration = dept.toLowerCase().includes('admin') && !isAdmissions;
                        const isAcademics = dept.toLowerCase().includes('academic');

                        const cleanPhone = inq.mobile.replace(/\D/g, '').slice(-10);
                        const waMsg = encodeURIComponent(
                          `Hello, this is Gopalan Pre-University College (North Campus) ${dept} Desk regarding your inquiry for ${inq.name}. How can we assist you with admissions & fees today?`
                        );

                        return (
                          <tr
                            key={inq.id}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              background: isNew ? 'rgba(254, 243, 199, 0.3)' : 'transparent',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            {/* 1. Ref & Date */}
                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <span style={{ fontWeight: 700, color: '#1E3A8A', display: 'block', fontSize: '0.82rem' }}>{inq.id}</span>
                              <span style={{ fontSize: '0.70rem', color: '#64748B' }}>
                                {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            {/* 2. Student & Parent */}
                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>{inq.name}</div>
                              <span style={{ fontSize: '0.70rem', color: '#64748B' }}>
                                Year: {inq.intendedYear || '2026-2027'}
                              </span>
                            </td>

                            {/* 3. Assigned Department & Staff Incharge */}
                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      background: isAccounts
                                        ? '#ECFDF5'
                                        : isAdmissions
                                        ? '#EFF6FF'
                                        : isAdministration
                                        ? '#FAF5FF'
                                        : '#FFFBEB',
                                      color: isAccounts
                                        ? '#065F46'
                                        : isAdmissions
                                        ? '#1E40AF'
                                        : isAdministration
                                        ? '#6B21A8'
                                        : '#92400E',
                                      border: `1px solid ${
                                        isAccounts
                                          ? '#A7F3D0'
                                          : isAdmissions
                                          ? '#BFDBFE'
                                          : isAdministration
                                          ? '#E9D5FF'
                                          : '#FDE68A'
                                      }`,
                                    }}
                                  >
                                    {isAccounts && <Receipt size={11} />}
                                    {isAdmissions && <GraduationCap size={11} />}
                                    {isAdministration && <Building size={11} />}
                                    {isAcademics && <BookOpen size={11} />}
                                    {dept}
                                  </span>

                                  {/* Department Switcher */}
                                  <select
                                    value={isAccounts ? 'Accounts' : isAdmissions ? 'Admissions' : isAdministration ? 'Administration' : 'Academics'}
                                    disabled={updatingId === inq.id}
                                    onChange={(e) => handleUpdateInquiryDepartment(inq.id, e.target.value)}
                                    title="Reassign Department"
                                    style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 600,
                                      padding: '1px 4px',
                                      borderRadius: '4px',
                                      border: '1px solid #CBD5E1',
                                      background: '#FFFFFF',
                                      color: '#475569',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <option value="Admissions">Admissions</option>
                                    <option value="Accounts">Accounts</option>
                                    <option value="Administration">Administration</option>
                                    <option value="Academics">Academics</option>
                                  </select>
                                </div>
                                <span style={{ fontSize: '0.70rem', color: '#64748B', fontWeight: 500 }}>
                                  Staff: {inq.assignedStaff || 'Admissions Desk'}
                                </span>
                              </div>
                            </td>

                            {/* 4. Contact & WhatsApp */}
                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <a
                                  href={`tel:${inq.mobile}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    color: '#2563EB',
                                    fontWeight: 700,
                                    fontSize: '0.80rem',
                                    textDecoration: 'none',
                                  }}
                                >
                                  <Phone size={11} /> {inq.mobile}
                                </a>

                                {cleanPhone.length >= 10 && (
                                  <a
                                    href={`https://wa.me/91${cleanPhone}?text=${waMsg}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      color: '#059669',
                                      fontWeight: 700,
                                      fontSize: '0.72rem',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <MessageCircle size={11} /> WhatsApp Desk
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* 5. Target Class & Stream */}
                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <span
                                style={{
                                  background: '#EFF6FF',
                                  color: '#1E40AF',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  display: 'inline-block',
                                }}
                              >
                                {inq.courseInterest || '12th Class (2nd PU)'}
                              </span>
                            </td>

                            {/* 6. Chatbot Inputs & Summary */}
                            <td style={{ padding: '12px 14px', verticalAlign: 'top', maxWidth: '320px' }}>
                              <div
                                style={{
                                  fontSize: '0.76rem',
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
                              <button
                                onClick={() => setSelectedInquiry(inq)}
                                style={{
                                  marginTop: '4px',
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563EB',
                                  fontSize: '0.70rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Eye size={11} /> View Full Conversation Log &amp; Notes
                              </button>
                            </td>

                            {/* 7. Status & Quick Actions */}
                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <select
                                  value={inq.status}
                                  disabled={updatingId === inq.id}
                                  onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                                  style={{
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    fontSize: '0.74rem',
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

                                <button
                                  onClick={() => setSelectedInquiry(inq)}
                                  style={{
                                    padding: '4px 8px',
                                    background: '#F1F5F9',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '6px',
                                    fontSize: '0.70rem',
                                    fontWeight: 700,
                                    color: '#334155',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Eye size={11} /> Open Detail
                                </button>
                              </div>
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
        {/* Slide-over / Modal for Full Inquiry Details & Conversation Log */}
        {selectedInquiry && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '20px',
            }}
            onClick={() => setSelectedInquiry(null)}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                padding: '28px',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E3A8A' }}>
                      {selectedInquiry.id}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background:
                          selectedInquiry.status === 'NEW'
                            ? '#FEF3C7'
                            : selectedInquiry.status === 'CONTACTED'
                            ? '#DBEAFE'
                            : selectedInquiry.status === 'RESOLVED'
                            ? '#DCFCE7'
                            : '#F1F5F9',
                        color:
                          selectedInquiry.status === 'NEW'
                            ? '#92400E'
                            : selectedInquiry.status === 'CONTACTED'
                            ? '#1E40AF'
                            : selectedInquiry.status === 'RESOLVED'
                            ? '#166534'
                            : '#475569',
                      }}
                    >
                      {selectedInquiry.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.80rem', color: '#64748B' }}>
                    Submitted on {new Date(selectedInquiry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedInquiry(null)}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Student & Parent Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Student &amp; Parent</div>
                  <div style={{ fontSize: '0.90rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{selectedInquiry.name}</div>
                </div>

                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Mobile / WhatsApp</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <a
                      href={`tel:${selectedInquiry.mobile}`}
                      style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Phone size={13} /> {selectedInquiry.mobile}
                    </a>
                    {selectedInquiry.mobile.replace(/\D/g, '').length >= 10 && (
                      <a
                        href={`https://wa.me/91${selectedInquiry.mobile.replace(/\D/g, '').slice(-10)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <MessageCircle size={13} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Course / Stream</div>
                  <div style={{ fontSize: '0.90rem', fontWeight: 700, color: '#1E40AF', marginTop: '2px' }}>
                    {selectedInquiry.courseInterest || '12th Class (2nd PU)'}
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Academic Session</div>
                  <div style={{ fontSize: '0.90rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                    {selectedInquiry.intendedYear || '2026-2027'}
                  </div>
                </div>
              </div>

              {/* Department Routing & Staff Incharge Controls */}
              <div style={{ padding: '16px', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} /> Department Routing &amp; Incharge Assignment
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Assigned Department
                    </label>
                    <select
                      value={selectedInquiry.assignedTeam}
                      onChange={(e) => handleUpdateInquiryDepartment(selectedInquiry.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #93C5FD',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: '#FFFFFF',
                        color: '#1E3A8A',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Admissions">Admissions Department</option>
                      <option value="Accounts">Accounts Department (Accountant)</option>
                      <option value="Administration">Campus Administration</option>
                      <option value="Academics">Academics &amp; Coaching</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Staff Incharge
                    </label>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', padding: '6px 10px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      {selectedInquiry.assignedStaff || 'Staff Desk'}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Inquiry Status
                    </label>
                    <select
                      value={selectedInquiry.status}
                      onChange={(e) => handleUpdateInquiryStatus(selectedInquiry.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #93C5FD',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: '#FFFFFF',
                        color: '#1E3A8A',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chatbot Conversation Log & Inputs Given by User */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} /> Inputs Given by User &amp; Conversation Log
                </div>
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    color: '#334155',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedInquiry.summary.split(' | ').map((part, idx) => (
                    <div key={idx} style={{ marginBottom: '4px' }}>
                      {part.startsWith('Chat update:') ? (
                        <span style={{ color: '#2563EB', fontWeight: 600 }}>💬 {part}</span>
                      ) : part.startsWith('Note:') ? (
                        <span style={{ color: '#D97706', fontWeight: 600 }}>📝 {part}</span>
                      ) : (
                        <span>• {part}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Notes by Accountant / Admissions Staff */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> Add Internal Note (Accountant / Admissions)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="e.g. Accountant: Discussed installment payment terms. Due date set for 10th June."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNote(selectedInquiry.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddNote(selectedInquiry.id)}
                    disabled={isSavingNote || !newNoteText.trim()}
                    style={{
                      padding: '8px 16px',
                      background: '#1E3A8A',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: newNoteText.trim() ? 'pointer' : 'not-allowed',
                      opacity: newNoteText.trim() ? 1 : 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Send size={13} /> {isSavingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
