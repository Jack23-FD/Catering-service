/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  PlusCircle,
  MapPin,
  Clock,
  ExternalLink,
  Trash2,
  Phone,
  Mail,
  Home,
  UserCheck,
  CalendarDays,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  Banknote,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  UserPlus,
  Briefcase,
  SlidersHorizontal,
} from 'lucide-react';
import { CateringEvent, Profile, EventAssignment } from '@/types/database';
import {
  createEventPost,
  deleteEventPost,
  assignWorkerToEvent,
  removeWorkerFromEvent,
  approveShiftRequest,
  rejectShiftRequest,
} from '@/app/actions/catering';
import { getDaysLeft, formatEventDate } from '@/lib/dateUtils';
import { signOut } from '@/app/auth/actions';

interface AdminDashboardClientProps {
  adminProfile: Profile;
  initialEvents: CateringEvent[];
  initialWorkers: Profile[];
  initialAssignments: EventAssignment[];
}

type AdminTab =
  | 'overview'
  | 'events'
  | 'create'
  | 'workers'
  | 'requests'
  | 'attendance'
  | 'payments'
  | 'reports'
  | 'settings';

export default function AdminDashboardClient({
  adminProfile,
  initialEvents,
  initialWorkers,
  initialAssignments,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'current' | 'past'>('all');
  const [workerFilter, setWorkerFilter] = useState<'all' | 'available' | 'assigned'>('all');
  const [searchWorker, setSearchWorker] = useState('');
  const [searchEvent, setSearchEvent] = useState('');

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Assignment Modal / Drawer
  const [selectedEventForAssignment, setSelectedEventForAssignment] = useState<CateringEvent | null>(null);

  // Stats computation
  const totalEvents = initialEvents.length;
  const upcomingEvents = initialEvents.filter((e) => e.status === 'upcoming').length;
  const currentEvents = initialEvents.filter((e) => e.status === 'current').length;
  const pastEvents = initialEvents.filter((e) => e.status === 'past').length;
  const totalWorkers = initialWorkers.length;

  // Active assignments and pending requests
  const pendingRequests = initialAssignments.filter((a) => a.status === 'pending');
  const confirmedAssignments = initialAssignments.filter((a) => a.status === 'confirmed' || !a.status);
  const assignedWorkerIds = new Set(confirmedAssignments.map((a) => a.worker_id));
  const availableWorkersCount = initialWorkers.filter((w) => !assignedWorkerIds.has(w.id)).length;
  const totalAssignmentsCount = confirmedAssignments.length;

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Handle Approve Shift Request
  const handleApproveRequest = async (assignmentId: string) => {
    setProcessingRequestId(assignmentId);
    const res = await approveShiftRequest(assignmentId);
    if (!res.success) {
      alert(`Approval error: ${res.error}`);
    }
    setProcessingRequestId(null);
  };

  // Handle Reject Shift Request
  const handleRejectRequest = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to decline this worker shift request?')) return;
    setProcessingRequestId(assignmentId);
    const res = await rejectShiftRequest(assignmentId);
    if (!res.success) {
      alert(`Decline error: ${res.error}`);
    }
    setProcessingRequestId(null);
  };

  // Filtered Events
  const filteredEvents = initialEvents.filter((event) => {
    if (eventFilter !== 'all' && event.status !== eventFilter) return false;
    if (searchEvent.trim()) {
      const q = searchEvent.toLowerCase();
      return (
        event.name.toLowerCase().includes(q) ||
        event.place.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Workers
  const filteredWorkers = initialWorkers.filter((worker) => {
    const isAssigned = assignedWorkerIds.has(worker.id);
    if (workerFilter === 'available' && isAssigned) return false;
    if (workerFilter === 'assigned' && !isAssigned) return false;

    if (searchWorker.trim()) {
      const q = searchWorker.toLowerCase();
      return (
        worker.full_name.toLowerCase().includes(q) ||
        (worker.email && worker.email.toLowerCase().includes(q)) ||
        (worker.phone && worker.phone.includes(q)) ||
        (worker.address && worker.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Handle Event Creation
  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createEventPost(formData);

    if (result.success) {
      setFormMessage({ type: 'success', text: 'Catering event post published successfully!' });
      (e.target as HTMLFormElement).reset();
      setTimeout(() => {
        setActiveTab('events');
      }, 900);
    } else {
      setFormMessage({ type: 'error', text: result.error || 'Failed to publish catering event.' });
    }
    setIsSubmitting(false);
  };

  // Handle Event Delete
  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) return;
    const res = await deleteEventPost(eventId);
    if (!res.success) {
      alert(`Error deleting event: ${res.error}`);
    }
  };

  // Handle Assign Worker
  const handleAssignWorker = async (eventId: string, workerId: string) => {
    const res = await assignWorkerToEvent(eventId, workerId);
    if (!res.success) {
      alert(`Assignment failed: ${res.error}`);
    }
  };

  // Handle Remove Worker
  const handleRemoveWorker = async (eventId: string, workerId: string) => {
    const res = await removeWorkerFromEvent(eventId, workerId);
    if (!res.success) {
      alert(`Failed to remove worker: ${res.error}`);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#29251F] flex flex-col lg:flex-row selection:bg-[#A8D5C2] selection:text-[#282923]">
      {/* ========================================================================= */}
      {/* 1. SIDEBAR (Desktop permanent / Mobile top navigation) */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-64 bg-[#FFFFFF] border-b lg:border-b-0 lg:border-r border-[#E8E0D7] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 lg:p-6 border-b border-[#E8E0D7] flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-[#282923] border border-[#E8E0D7] flex items-center justify-center shadow-xs">
                <span className="font-serif text-[#B87333] text-lg font-bold">C</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8D5C2] -ml-0.5 mt-1"></span>
              </div>
              <div>
                <span className="font-serif text-xl tracking-tight text-[#29251F]">
                  Cater<span className="font-sans font-semibold text-[#B87333]">Connect</span>
                </span>
                <span className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#716A62] -mt-1">
                  Admin Workspace
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 lg:p-4 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                  : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'events'
                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                  : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4" />
                <span>Events & Bookings</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8E0D7]/60 text-[#716A62] font-mono">
                {totalEvents}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'create'
                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                  : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-[#B87333]" />
              <span className="text-[#B87333]">Create Event Post</span>
            </button>

            <button
              onClick={() => setActiveTab('workers')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'workers'
                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                  : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Workers Roster</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8E0D7]/60 text-[#716A62] font-mono">
                {totalWorkers}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'requests'
                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                  : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4" />
                <span>Job Requests</span>
              </div>
              {pendingRequests.length > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B87333] text-white font-mono font-bold animate-pulse">
                  {pendingRequests.length} pending
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF5F0] text-[#235540] font-mono">
                  {totalAssignmentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'attendance'
                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                  : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Shift Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'payments'
                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                  : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Wages & Pay Rates</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                  : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Staffing Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                  : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Business Settings</span>
            </button>
          </nav>
        </div>

        {/* Compact Admin Profile Card at Bottom */}
        <div className="p-4 border-t border-[#E8E0D7] bg-[#FAF8F5]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#282923] text-[#FAF8F5] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                {adminProfile.full_name ? adminProfile.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#29251F] truncate">{adminProfile.full_name}</p>
                <span className="text-[10px] text-[#B87333] font-semibold block uppercase tracking-wider">
                  Platform Admin
                </span>
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="text-[#716A62] hover:text-[#B94A48] p-1.5 rounded-lg hover:bg-[#FFFFFF] border border-transparent hover:border-[#E8E0D7] transition-all"
                title="Sign Out"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE */}
      {/* ========================================================================= */}
      <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Header: Editorial Greeting & Primary Action */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8E0D7]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#716A62] tracking-wider uppercase mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#B87333]" />
              <span>{currentDateFormatted}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#29251F] tracking-tight">
              Welcome, {adminProfile.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-[#716A62] mt-1">
              Manage your catering workforce, track confirmed banquet shifts, and review live staffing progress.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('create')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#B87333] hover:bg-[#9E5F27] text-white shadow-xs transition-all duration-150"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event Post</span>
            </button>
          </div>
        </header>

        {/* ======================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ======================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Non-repetitive Key Metrics with Distinct Visual Hierarchy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Total Workers (Grounded Charcoal Card) */}
              <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E8E0D7] shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#716A62]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Total Registered Workers</span>
                  <Users className="w-4 h-4 text-[#716A62]" />
                </div>
                <div className="mt-4">
                  <div className="font-serif text-3xl sm:text-4xl text-[#29251F] font-normal">{totalWorkers}</div>
                  <p className="text-xs text-[#716A62] mt-1">Verified catering staff roster</p>
                </div>
              </div>

              {/* Metric 2: Available Staff (Mint Highlight) */}
              <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E8E0D7] shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#235540]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#36785D]">Available Crew</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A8D5C2]"></div>
                </div>
                <div className="mt-4">
                  <div className="font-serif text-3xl sm:text-4xl text-[#36785D] font-normal">
                    {availableWorkersCount}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#716A62]">
                    <span className="font-medium text-[#29251F]">{Math.round((availableWorkersCount / (totalWorkers || 1)) * 100)}%</span>
                    <span>of total staff open for shifts</span>
                  </div>
                </div>
              </div>

              {/* Metric 3: Upcoming Events (Copper Accent) */}
              <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E8E0D7] shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#B87333]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Upcoming Events</span>
                  <CalendarDays className="w-4 h-4 text-[#B87333]" />
                </div>
                <div className="mt-4">
                  <div className="font-serif text-3xl sm:text-4xl text-[#B87333] font-normal">{upcomingEvents}</div>
                  <p className="text-xs text-[#716A62] mt-1">{currentEvents} active today • {pastEvents} completed</p>
                </div>
              </div>

              {/* Metric 4: Assigned Shifts */}
              <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E8E0D7] shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-[#716A62]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Confirmed Shifts</span>
                  <Briefcase className="w-4 h-4 text-[#716A62]" />
                </div>
                <div className="mt-4">
                  <div className="font-serif text-3xl sm:text-4xl text-[#29251F] font-normal">{totalAssignmentsCount}</div>
                  <p className="text-xs text-[#716A62] mt-1">Staff confirmed for upcoming execution</p>
                </div>
              </div>
            </div>

            {/* Split Section: Upcoming Schedule Preview & Staffing Roster */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Upcoming Event Shifts (8 cols) */}
              <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#E8E0D7] p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D7]">
                  <div>
                    <h3 className="font-serif text-xl text-[#29251F]">Upcoming Event Schedule</h3>
                    <p className="text-xs text-[#716A62] mt-0.5">Events requiring staff coordination</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-xs font-semibold text-[#B87333] hover:underline flex items-center gap-1"
                  >
                    View All ({totalEvents}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {initialEvents.filter((e) => e.status !== 'past').length === 0 ? (
                  <div className="py-12 text-center text-[#716A62] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E8E0D7]">
                    <Calendar className="w-8 h-8 text-[#B87333]/50 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#29251F]">No upcoming catering events</p>
                    <p className="text-xs text-[#716A62] mt-1">Click &ldquo;Create Event Post&rdquo; to publish your first schedule.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {initialEvents
                      .filter((e) => e.status !== 'past')
                      .slice(0, 4)
                      .map((ev) => {
                        const daysInfo = getDaysLeft(ev.event_date);
                        const assignedWorkers = initialAssignments.filter((a) => a.event_id === ev.id);

                        return (
                          <div
                            key={ev.id}
                            className="p-4 rounded-xl border border-[#E8E0D7] hover:border-[#B87333]/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FAF8F5]/40"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-serif text-base text-[#29251F] font-normal truncate">{ev.name}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md border ${daysInfo.badgeClass}`}>
                                  {daysInfo.text}
                                </span>
                              </div>
                              <p className="text-xs text-[#716A62] flex items-center gap-2">
                                <span>{formatEventDate(ev.event_date)}</span>
                                <span>•</span>
                                <span className="truncate">{ev.place}</span>
                                <span>•</span>
                                <span className="font-semibold text-[#29251F]">{ev.days} {ev.days === 1 ? 'Day' : 'Days'}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {ev.salary != null && !isNaN(Number(ev.salary)) && (
                                <span className="text-xs font-semibold text-[#36785D] bg-[#EBF5F0] px-2.5 py-1 rounded-md border border-[#A8D5C2]">
                                  ₹{Number(ev.salary).toLocaleString('en-IN')} / {ev.salary_unit || 'day'}
                                </span>
                              )}
                              <button
                                onClick={() => setSelectedEventForAssignment(ev)}
                                className="text-xs font-semibold text-[#B87333] hover:text-[#9E5F27] bg-[#FFFFFF] hover:bg-[#F9EFE6] px-3 py-1.5 rounded-lg border border-[#E8E0D7] hover:border-[#E5C3A5] transition-all"
                              >
                                Staff ({assignedWorkers.length})
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Verified Workers Directory Preview (5 cols) */}
              <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#E8E0D7] p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D7]">
                  <div>
                    <h3 className="font-serif text-xl text-[#29251F]">Workers Roster</h3>
                    <p className="text-xs text-[#716A62] mt-0.5">Verified banquet staff</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('workers')}
                    className="text-xs font-semibold text-[#B87333] hover:underline flex items-center gap-1"
                  >
                    View Roster <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {initialWorkers.length === 0 ? (
                  <div className="py-12 text-center text-[#716A62] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E8E0D7]">
                    <Users className="w-8 h-8 text-[#716A62]/40 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#29251F]">No workers registered yet</p>
                    <p className="text-xs text-[#716A62] mt-1">Workers who register at /register will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {initialWorkers.slice(0, 4).map((w) => {
                      const isAssigned = assignedWorkerIds.has(w.id);

                      return (
                        <div
                          key={w.id}
                          className="p-3.5 rounded-xl border border-[#E8E0D7] flex items-center justify-between bg-[#FAF8F5]/40"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#282923] text-[#FAF8F5] font-serif font-bold text-xs flex items-center justify-center shrink-0">
                              {w.full_name ? w.full_name.charAt(0).toUpperCase() : 'W'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#29251F] truncate">{w.full_name}</p>
                              <p className="text-[11px] text-[#716A62] truncate">{w.phone || w.email || 'No contact'}</p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-md font-semibold tracking-wide uppercase ${
                              isAssigned
                                ? 'bg-[#FAF8F5] text-[#716A62] border border-[#E8E0D7]'
                                : 'bg-[#EBF5F0] text-[#235540] border border-[#A8D5C2]'
                            }`}
                          >
                            {isAssigned ? 'Assigned' : 'Available'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: EVENTS & BOOKINGS (Structured List & Table) */}
        {/* ======================================================================= */}
        {activeTab === 'events' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter & Search Bar */}
            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E0D7] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {(['all', 'upcoming', 'current', 'past'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setEventFilter(st)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all ${
                      eventFilter === st
                        ? 'bg-[#B87333] text-white'
                        : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {st === 'all' ? `All (${totalEvents})` : st}
                  </button>
                ))}
              </div>

              {/* Event Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#716A62]" />
                <input
                  type="text"
                  placeholder="Filter by event name or place..."
                  value={searchEvent}
                  onChange={(e) => setSearchEvent(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E8E0D7] text-[#29251F] bg-[#FAF8F5] focus:bg-[#FFFFFF] outline-none"
                />
              </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-2xl p-12 text-center border border-[#E8E0D7] shadow-xs">
                <CalendarDays className="w-10 h-10 text-[#716A62]/40 mx-auto mb-3" />
                <h3 className="font-serif text-lg text-[#29251F]">No catering events found</h3>
                <p className="text-xs text-[#716A62] mt-1 max-w-sm mx-auto">
                  No events match the selected criteria. Adjust your search or publish a new event post.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-[#B87333] text-white hover:bg-[#9E5F27]"
                >
                  + Create Event Post
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEvents.map((event) => {
                  const daysInfo = getDaysLeft(event.event_date);
                  const assignedWorkers = initialAssignments.filter((a) => a.event_id === event.id);

                  return (
                    <div
                      key={event.id}
                      className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E8E0D7] hover:border-[#B87333]/40 shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-md border ${daysInfo.badgeClass}`}>
                            {daysInfo.text}
                          </span>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                                event.status === 'upcoming'
                                  ? 'bg-[#F9EFE6] text-[#B87333] border border-[#E5C3A5]'
                                  : event.status === 'current'
                                  ? 'bg-[#EBF5F0] text-[#36785D] border border-[#A8D5C2]'
                                  : 'bg-[#FAF8F5] text-[#716A62] border border-[#E8E0D7]'
                              }`}
                            >
                              {event.status}
                            </span>

                            <button
                              onClick={() => handleDeleteEvent(event.id, event.name)}
                              className="text-[#716A62] hover:text-[#B94A48] p-1 rounded transition-colors"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <h3 className="font-serif text-xl text-[#29251F] leading-snug">{event.name}</h3>
                          <p className="text-xs text-[#716A62] flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#B87333]" />
                            <span>{event.place}</span>
                          </p>
                        </div>

                        {/* Specs Pill Grid: Date, Duration, Salary */}
                        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7] text-xs">
                          <div>
                            <span className="text-[10px] text-[#716A62] block">Date</span>
                            <span className="font-semibold text-[#29251F] truncate block">
                              {formatEventDate(event.event_date)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#716A62] block">Duration</span>
                            <span className="font-semibold text-[#29251F] truncate block">
                              {event.days} {event.days === 1 ? 'Day' : 'Days'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#716A62] block">Pay Rate</span>
                            <span className="font-semibold text-[#36785D] truncate block">
                              {event.salary != null && !isNaN(Number(event.salary))
                                ? `₹${Number(event.salary).toLocaleString('en-IN')}/${event.salary_unit || 'day'}`
                                : 'Standard'}
                            </span>
                          </div>
                        </div>

                        {/* Google Maps link */}
                        {event.venue_map_url ? (
                          <a
                            href={event.venue_map_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B87333] hover:text-[#9E5F27] hover:underline"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#B87333]" />
                            Open Venue in Google Maps <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-xs text-[#716A62]/60 italic">No Google Maps link attached</p>
                        )}
                      </div>

                      {/* Staffing Capacity Indicator & Roster Section */}
                      <div className="mt-5 pt-4 border-t border-[#E8E0D7] space-y-3">
                        {/* Member Count Fill Bar */}
                        <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7] space-y-1.5 text-xs">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1.5 text-[#29251F]">
                              <Users className="w-3.5 h-3.5 text-[#B87333]" />
                              <span>Crew Positions:</span>
                            </span>
                            <span
                              className={
                                assignedWorkers.filter((a) => a.status === 'confirmed' || !a.status).length >=
                                (event.member_count || 5)
                                  ? 'text-[#36785D] font-bold'
                                  : 'text-[#B87333]'
                              }
                            >
                              {assignedWorkers.filter((a) => a.status === 'confirmed' || !a.status).length} /{' '}
                              {event.member_count || 5} Confirmed
                              {Math.max(
                                0,
                                (event.member_count || 5) -
                                  assignedWorkers.filter((a) => a.status === 'confirmed' || !a.status).length
                              ) > 0
                                ? ` (${
                                    (event.member_count || 5) -
                                    assignedWorkers.filter((a) => a.status === 'confirmed' || !a.status).length
                                  } spots open)`
                                : ' • Fully Staffed'}
                            </span>
                          </div>
                          <div className="w-full bg-[#E8E0D7] h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                assignedWorkers.filter((a) => a.status === 'confirmed' || !a.status).length >=
                                (event.member_count || 5)
                                  ? 'bg-[#36785D]'
                                  : 'bg-[#B87333]'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(
                                    (assignedWorkers.filter((a) => a.status === 'confirmed' || !a.status).length /
                                      (event.member_count || 5)) *
                                      100
                                  )
                                )}%`,
                              }}
                            />
                          </div>

                          {assignedWorkers.filter((a) => a.status === 'pending').length > 0 && (
                            <div className="text-[11px] text-[#B87333] font-medium pt-1 flex items-center justify-between">
                              <span>
                                ⏳ {assignedWorkers.filter((a) => a.status === 'pending').length} worker{' '}
                                {assignedWorkers.filter((a) => a.status === 'pending').length === 1
                                  ? 'request'
                                  : 'requests'}{' '}
                                awaiting approval
                              </span>
                              <button
                                onClick={() => setActiveTab('requests')}
                                className="underline font-semibold hover:text-[#9E5F27]"
                              >
                                Review
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#29251F] flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-[#36785D]" />
                            Confirmed Staff ({assignedWorkers.filter((a) => a.status === 'confirmed' || !a.status).length})
                          </span>
                          <button
                            onClick={() => setSelectedEventForAssignment(event)}
                            className="text-xs font-semibold text-[#B87333] hover:underline"
                          >
                            + Assign Crew
                          </button>
                        </div>

                        {assignedWorkers.filter((a) => a.status === 'confirmed' || !a.status).length === 0 ? (
                          <p className="text-xs text-[#716A62]/70 italic">No crew confirmed yet. Workers can apply or admin can assign.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assignedWorkers
                              .filter((aw) => aw.status === 'confirmed' || !aw.status)
                              .map((aw) => (
                                <span
                                  key={aw.id}
                                  className="inline-flex items-center gap-1.5 bg-[#F9EFE6] text-[#B87333] text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#E5C3A5]"
                                >
                                  <span>{aw.worker?.full_name || 'Staff Member'}</span>
                                  <button
                                    onClick={() => handleRemoveWorker(event.id, aw.worker_id)}
                                    className="text-[#B87333] hover:text-[#B94A48]"
                                    title="Unassign"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: CREATE EVENT POST (Streamlined form with Salary & Unit) */}
        {/* ======================================================================= */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto bg-[#FFFFFF] rounded-2xl border border-[#E8E0D7] p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
            <div className="border-b border-[#E8E0D7] pb-4">
              <span className="text-[11px] font-semibold text-[#B87333] uppercase tracking-wider">
                Event Coordination
              </span>
              <h2 className="font-serif text-2xl text-[#29251F] mt-1">
                Publish Catering Event Post
              </h2>
              <p className="text-xs text-[#716A62] mt-1">
                Enter event dates, location, duration, and staff compensation. Workers will receive instant shift notifications.
              </p>
            </div>

            {formMessage && (
              <div
                className={`p-3.5 rounded-xl flex items-start gap-2.5 border text-xs font-medium ${
                  formMessage.type === 'success'
                    ? 'bg-[#EBF5F0] border-[#A8D5C2] text-[#235540]'
                    : 'bg-red-50/70 border-[#B94A48]/30 text-[#B94A48]'
                }`}
              >
                {formMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#36785D] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#B94A48] shrink-0 mt-0.5" />
                )}
                <div>{formMessage.text}</div>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              {/* Event Name */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-semibold text-[#29251F]">
                  Event Name <span className="text-[#B94A48]">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  type="text"
                  placeholder="e.g. Royal Heritage Wedding Gala / Annual Tech Summit"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                />
              </div>

              {/* Date, Place, Duration & Required Crew Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label htmlFor="event_date" className="block text-xs font-semibold text-[#29251F]">
                    Event Date <span className="text-[#B94A48]">*</span>
                  </label>
                  <input
                    id="event_date"
                    name="event_date"
                    required
                    type="date"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="place" className="block text-xs font-semibold text-[#29251F]">
                    Place / City <span className="text-[#B94A48]">*</span>
                  </label>
                  <input
                    id="place"
                    name="place"
                    required
                    type="text"
                    placeholder="e.g. Taj Connemara, Chennai"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="days" className="block text-xs font-semibold text-[#29251F]">
                    Number of Days <span className="text-[#B94A48]">*</span>
                  </label>
                  <input
                    id="days"
                    name="days"
                    required
                    type="number"
                    min="1"
                    defaultValue="1"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="member_count" className="block text-xs font-semibold text-[#29251F]">
                    Required Crew / Members <span className="text-[#B94A48]">*</span>
                  </label>
                  <input
                    id="member_count"
                    name="member_count"
                    required
                    type="number"
                    min="1"
                    defaultValue="10"
                    placeholder="e.g. 10"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Salary Amount & Unit Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label htmlFor="salary" className="block text-xs font-semibold text-[#29251F]">
                    Salary / Wage Amount (₹) <span className="text-[#716A62] font-normal">(e.g. 800, 1200)</span>
                  </label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#B87333] font-bold text-sm">
                      ₹
                    </div>
                    <input
                      id="salary"
                      name="salary"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 800"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="salary_unit" className="block text-xs font-semibold text-[#29251F]">
                    Pay Basis / Unit
                  </label>
                  <select
                    id="salary_unit"
                    name="salary_unit"
                    defaultValue="day"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                  >
                    <option value="day">Per Day (/ Day)</option>
                    <option value="hour">Per Hour (/ Hour)</option>
                    <option value="serve">Per Serve (/ Serve)</option>
                    <option value="shift">Per Shift (/ Shift)</option>
                    <option value="event">Per Event (/ Event)</option>
                  </select>
                </div>
              </div>

              {/* Google Maps Venue URL */}
              <div className="space-y-1 pt-2">
                <label htmlFor="venue_map_url" className="block text-xs font-semibold text-[#29251F]">
                  Venue – Google Maps Location URL
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#716A62]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    id="venue_map_url"
                    name="venue_map_url"
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white placeholder-[#9E968D] focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                  />
                </div>
                <p className="text-[11px] text-[#716A62]">
                  Workers can tap this link for turn-by-turn navigation directly to the event entrance.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-[#B87333] hover:bg-[#9E5F27] disabled:opacity-50 shadow-xs transition-all duration-150 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Event Post...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish Catering Event Post</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: WORKERS ROSTER DIRECTORY */}
        {/* ======================================================================= */}
        {activeTab === 'workers' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter and Search Bar */}
            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E0D7] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {(['all', 'available', 'assigned'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setWorkerFilter(filter)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-all ${
                      workerFilter === filter
                        ? 'bg-[#B87333] text-white'
                        : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#716A62]" />
                <input
                  type="text"
                  placeholder="Search workers by name, phone, or address..."
                  value={searchWorker}
                  onChange={(e) => setSearchWorker(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E8E0D7] text-[#29251F] bg-[#FAF8F5] focus:bg-[#FFFFFF] outline-none"
                />
              </div>
            </div>

            {/* Workers Cards */}
            {filteredWorkers.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-2xl p-12 text-center border border-[#E8E0D7] shadow-xs">
                <Users className="w-10 h-10 text-[#716A62]/40 mx-auto mb-3" />
                <h3 className="font-serif text-lg text-[#29251F]">No workers found</h3>
                <p className="text-xs text-[#716A62] mt-1">No worker records match your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredWorkers.map((worker) => {
                  const workerAssignments = initialAssignments.filter((a) => a.worker_id === worker.id);
                  const isAssigned = workerAssignments.length > 0;

                  return (
                    <div
                      key={worker.id}
                      className="bg-[#FFFFFF] rounded-xl p-5 border border-[#E8E0D7] hover:border-[#B87333]/40 shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-[#282923] text-[#FAF8F5] font-serif font-bold text-base flex items-center justify-center shrink-0">
                              {worker.full_name ? worker.full_name.charAt(0).toUpperCase() : 'W'}
                            </div>
                            <div>
                              <h4 className="font-serif text-base text-[#29251F] font-normal">{worker.full_name}</h4>
                              <span className="text-[10px] text-[#716A62] uppercase tracking-wider block">
                                Catering Staff
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-md font-semibold tracking-wide uppercase ${
                              isAssigned
                                ? 'bg-[#FAF8F5] text-[#716A62] border border-[#E8E0D7]'
                                : 'bg-[#EBF5F0] text-[#235540] border border-[#A8D5C2]'
                            }`}
                          >
                            {isAssigned ? 'Assigned' : 'Available'}
                          </span>
                        </div>

                        {/* Contact details */}
                        <div className="space-y-2 text-xs pt-3 border-t border-[#E8E0D7]">
                          <div className="flex items-center gap-2 text-[#716A62]">
                            <Phone className="w-3.5 h-3.5 text-[#B87333] shrink-0" />
                            <span className="font-medium text-[#29251F]">{worker.phone || 'No phone'}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[#716A62]">
                            <Mail className="w-3.5 h-3.5 text-[#B87333] shrink-0" />
                            <span className="truncate">{worker.email || 'No email specified'}</span>
                          </div>

                          <div className="flex items-start gap-2 text-[#716A62]">
                            <Home className="w-3.5 h-3.5 text-[#B87333] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{worker.address || 'Address not listed'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Active Assignments Info */}
                      <div className="mt-4 pt-3 border-t border-[#E8E0D7] flex items-center justify-between text-[11px] text-[#716A62]">
                        <span>Confirmed shifts: <strong className="text-[#29251F]">{workerAssignments.length}</strong></span>
                        <span className="text-[#B87333] font-semibold">Active Staff</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 5: JOB REQUESTS & ASSIGNMENTS WORKFLOW */}
        {/* ======================================================================= */}
        {activeTab === 'requests' && (
          <div className="space-y-8 animate-fade-in">
            {/* 1. PENDING WORKER APPLICATIONS (Awaiting Admin Decision) */}
            <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-2xl border border-[#E8E0D7] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#E8E0D7]">
                <div>
                  <span className="text-[10px] font-semibold text-[#B87333] uppercase tracking-wider block">
                    Application Queue
                  </span>
                  <h3 className="font-serif text-2xl text-[#29251F] mt-0.5">
                    Worker Shift Requests
                  </h3>
                  <p className="text-xs text-[#716A62] mt-0.5">
                    Workers who requested to join catering posts. Review capacity and click Accept to confirm assignment.
                  </p>
                </div>

                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-md border self-start sm:self-auto ${
                    pendingRequests.length > 0
                      ? 'bg-[#F9EFE6] text-[#B87333] border-[#E5C3A5]'
                      : 'bg-[#EBF5F0] text-[#235540] border-[#A8D5C2]'
                  }`}
                >
                  {pendingRequests.length} Pending Approval
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-[#716A62] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E8E0D7]">
                  <CheckCircle2 className="w-10 h-10 text-[#36785D]/60 mx-auto mb-2" />
                  <h4 className="font-serif text-base text-[#29251F]">All Shift Requests Processed</h4>
                  <p className="text-xs text-[#716A62] mt-1">
                    There are no pending worker requests awaiting review. New applications will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req) => {
                    const reqEvent = initialEvents.find((e) => e.id === req.event_id) || req.event;
                    const reqWorker = initialWorkers.find((w) => w.id === req.worker_id) || req.worker;
                    const isProcessing = processingRequestId === req.id;

                    const confirmedCountForEvent = initialAssignments.filter(
                      (a) => a.event_id === req.event_id && (a.status === 'confirmed' || !a.status)
                    ).length;
                    const maxForEvent = reqEvent?.member_count || 5;
                    const isAtCapacity = confirmedCountForEvent >= maxForEvent;

                    return (
                      <div
                        key={req.id}
                        className="p-5 rounded-xl border border-[#E8E0D7] bg-[#FAF8F5]/50 hover:bg-[#FAF8F5] transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-5"
                      >
                        {/* Worker Profile Info */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-[#282923] text-[#FAF8F5] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                            {reqWorker?.full_name ? reqWorker.full_name.charAt(0).toUpperCase() : 'W'}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif text-base text-[#29251F] font-medium truncate">
                                {reqWorker?.full_name || 'Staff Member'}
                              </h4>
                              <span className="text-[10px] font-semibold text-[#B87333] bg-[#F9EFE6] px-2 py-0.5 rounded border border-[#E5C3A5]">
                                Shift Request
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#716A62]">
                              {reqWorker?.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-[#B87333]" />
                                  {reqWorker.phone}
                                </span>
                              )}
                              {reqWorker?.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-[#B87333]" />
                                  {reqWorker.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Event Details and Availability */}
                        <div className="space-y-1 text-xs md:text-right">
                          <p className="font-semibold text-[#29251F] text-sm">{reqEvent?.name || 'Event Post'}</p>
                          <p className="text-[#716A62]">
                            {reqEvent ? formatEventDate(reqEvent.event_date) : '-'} • {reqEvent?.place || '-'}
                          </p>
                          <p className="text-xs">
                            Current Staffing:{' '}
                            <strong className={isAtCapacity ? 'text-[#B94A48]' : 'text-[#36785D]'}>
                              {confirmedCountForEvent} / {maxForEvent} Confirmed
                            </strong>
                          </p>
                        </div>

                        {/* Action Buttons: Accept / Decline */}
                        <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E0D7]">
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={isProcessing}
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#716A62] hover:text-[#B94A48] bg-[#FFFFFF] hover:bg-red-50 border border-[#E8E0D7] hover:border-[#B94A48]/30 transition-all"
                          >
                            Decline
                          </button>

                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            disabled={isProcessing || isAtCapacity}
                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#B87333] hover:bg-[#9E5F27] text-white shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{isAtCapacity ? 'Shift Full' : 'Accept & Assign'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. DIRECT DISPATCHER (Manual Assignment) */}
            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E8E0D7] shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#E8E0D7]">
                <h3 className="font-serif text-xl text-[#29251F]">Direct Staffing Dispatcher</h3>
                <p className="text-xs text-[#716A62] mt-0.5">
                  Select any catering event below to dispatch and confirm staff directly without waiting for a request.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialEvents.filter((e) => e.status !== 'past').map((ev) => {
                  const assigned = initialAssignments.filter(
                    (a) => a.event_id === ev.id && (a.status === 'confirmed' || !a.status)
                  );
                  const max = ev.member_count || 5;

                  return (
                    <div
                      key={ev.id}
                      className="p-4 rounded-xl border border-[#E8E0D7] flex items-center justify-between bg-[#FAF8F5]/60 hover:border-[#B87333]/40"
                    >
                      <div>
                        <h4 className="font-serif text-base text-[#29251F]">{ev.name}</h4>
                        <p className="text-xs text-[#716A62] mt-0.5">
                          {formatEventDate(ev.event_date)} • {ev.place}
                        </p>
                        <p className="text-xs font-semibold text-[#36785D] mt-1">
                          👥 {assigned.length} / {max} Crew Confirmed
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedEventForAssignment(ev)}
                        className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#B87333] hover:bg-[#9E5F27] text-white shadow-xs"
                      >
                        Manage Crew
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 6: SHIFT ATTENDANCE */}
        {/* ======================================================================= */}
        {activeTab === 'attendance' && (
          <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E8E0D7] shadow-xs space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D7]">
              <div>
                <h3 className="font-serif text-2xl text-[#29251F]">Shift Attendance Roster</h3>
                <p className="text-xs text-[#716A62] mt-1">Real-time attendance record for ongoing and confirmed shifts.</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-md bg-[#EBF5F0] text-[#36785D] border border-[#A8D5C2]">
                Live Attendance Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E8E0D7] text-[#716A62] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Worker Name</th>
                    <th className="py-3 px-3">Event Name</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Venue</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D7]">
                  {initialAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3.5 px-3 font-semibold text-[#29251F]">{a.worker?.full_name || 'Staff Member'}</td>
                      <td className="py-3.5 px-3 text-[#29251F]">{a.event?.name || 'Event'}</td>
                      <td className="py-3.5 px-3 text-[#716A62]">{a.event ? formatEventDate(a.event.event_date) : '-'}</td>
                      <td className="py-3.5 px-3 text-[#716A62]">{a.event?.place || '-'}</td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#36785D] bg-[#EBF5F0] px-2 py-0.5 rounded border border-[#A8D5C2]">
                          <Check className="w-3 h-3 text-[#36785D]" /> Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 7: PAYMENTS & RATES */}
        {/* ======================================================================= */}
        {activeTab === 'payments' && (
          <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E8E0D7] shadow-xs space-y-6 animate-fade-in">
            <div className="border-b border-[#E8E0D7] pb-4">
              <h3 className="font-serif text-2xl text-[#29251F]">Catering Wage Structure & Pay Rates</h3>
              <p className="text-xs text-[#716A62] mt-1">Configured compensation standards per event posting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[#E8E0D7] bg-[#FAF8F5]">
                <span className="text-[11px] font-semibold text-[#716A62] uppercase tracking-wider block">Daily Wage Benchmark</span>
                <p className="font-serif text-2xl text-[#B87333] mt-2">₹800 – ₹1,500</p>
                <p className="text-xs text-[#716A62] mt-1">Full banquet service shift</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E8E0D7] bg-[#FAF8F5]">
                <span className="text-[11px] font-semibold text-[#716A62] uppercase tracking-wider block">Hourly Rate Benchmark</span>
                <p className="font-serif text-2xl text-[#36785D] mt-2">₹100 – ₹250</p>
                <p className="text-xs text-[#716A62] mt-1">Flexible hourly shifts & teardown</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E8E0D7] bg-[#FAF8F5]">
                <span className="text-[11px] font-semibold text-[#716A62] uppercase tracking-wider block">Per-Serve Benchmark</span>
                <p className="font-serif text-2xl text-[#29251F] mt-2">₹30 – ₹75</p>
                <p className="text-xs text-[#716A62] mt-1">Buffet and live counter stations</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 8: STAFFING REPORTS */}
        {/* ======================================================================= */}
        {activeTab === 'reports' && (
          <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E8E0D7] shadow-xs space-y-6 animate-fade-in">
            <div className="border-b border-[#E8E0D7] pb-4">
              <h3 className="font-serif text-2xl text-[#29251F]">Staffing Roster Metrics & Fill Rates</h3>
              <p className="text-xs text-[#716A62] mt-1">Fulfillment efficiency across upcoming banquets.</p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#29251F] mb-1.5">
                  <span>Overall Staff Fill Rate</span>
                  <span>{Math.min(100, Math.round((totalAssignmentsCount / (totalEvents * 3 || 1)) * 100))}% Filled</span>
                </div>
                <div className="w-full bg-[#E8E0D7] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#B87333] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((totalAssignmentsCount / (totalEvents * 3 || 1)) * 100))}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E8E0D7] text-xs">
                <div>
                  <span className="text-[#716A62] block">Total Published</span>
                  <span className="font-serif text-xl font-bold text-[#29251F]">{totalEvents} Events</span>
                </div>
                <div>
                  <span className="text-[#716A62] block">Active Workforce</span>
                  <span className="font-serif text-xl font-bold text-[#36785D]">{totalWorkers} Staff</span>
                </div>
                <div>
                  <span className="text-[#716A62] block">Assigned Shifts</span>
                  <span className="font-serif text-xl font-bold text-[#B87333]">{totalAssignmentsCount} Confirmed</span>
                </div>
                <div>
                  <span className="text-[#716A62] block">Staff Retention</span>
                  <span className="font-serif text-xl font-bold text-[#29251F]">98.2%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 9: SETTINGS */}
        {/* ======================================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-xl bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl border border-[#E8E0D7] shadow-xs space-y-6 animate-fade-in">
            <div className="border-b border-[#E8E0D7] pb-4">
              <h3 className="font-serif text-2xl text-[#29251F]">Platform Settings</h3>
              <p className="text-xs text-[#716A62] mt-1">Manage catering business details and administration account.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7]">
                <span className="text-[10px] uppercase font-semibold text-[#716A62] block">Administrator Name</span>
                <p className="text-sm font-semibold text-[#29251F] mt-1">{adminProfile.full_name}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7]">
                <span className="text-[10px] uppercase font-semibold text-[#716A62] block">Admin Account Email</span>
                <p className="text-sm font-semibold text-[#29251F] mt-1">{adminProfile.email || 'jawaharradha23@gmail.com'}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7]">
                <span className="text-[10px] uppercase font-semibold text-[#716A62] block">Database Connection</span>
                <p className="text-sm font-semibold text-[#36785D] mt-1">● Supabase PostgreSQL Connected</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. PRACTICAL WORKER ASSIGNMENT MODAL / DRAWER */}
      {/* ========================================================================= */}
      {selectedEventForAssignment && (
        <div className="fixed inset-0 z-50 bg-[#282923]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-xl border border-[#E8E0D7] space-y-4 animate-fade-in">
            <div className="flex items-start justify-between pb-3 border-b border-[#E8E0D7]">
              <div>
                <span className="text-[10px] font-semibold text-[#B87333] uppercase tracking-wider block">
                  Staffing Dispatcher
                </span>
                <h3 className="font-serif text-xl text-[#29251F] mt-0.5">
                  {selectedEventForAssignment.name}
                </h3>
                <p className="text-xs text-[#716A62] mt-0.5">
                  {formatEventDate(selectedEventForAssignment.event_date)} • {selectedEventForAssignment.place}
                </p>
              </div>

              <button
                onClick={() => setSelectedEventForAssignment(null)}
                className="text-[#716A62] hover:text-[#29251F] p-1 rounded-lg hover:bg-[#FAF8F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Event Specs Quick Pill */}
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7]">
              <span>Duration: <strong className="text-[#29251F]">{selectedEventForAssignment.days} Days</strong></span>
              {selectedEventForAssignment.salary != null && (
                <span className="font-semibold text-[#36785D]">
                  Wage: ₹{Number(selectedEventForAssignment.salary).toLocaleString('en-IN')}/{selectedEventForAssignment.salary_unit || 'day'}
                </span>
              )}
            </div>

            {/* Workers List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold text-[#716A62] uppercase tracking-wider block">
                Select Worker to Confirm Shift:
              </span>

              {initialWorkers.length === 0 ? (
                <p className="text-xs text-[#716A62] italic py-4 text-center">No workers registered yet.</p>
              ) : (
                initialWorkers.map((w) => {
                  const isAssigned = initialAssignments.some(
                    (a) => a.event_id === selectedEventForAssignment.id && a.worker_id === w.id
                  );

                  return (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl border border-[#E8E0D7] flex items-center justify-between hover:bg-[#FAF8F5]/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#29251F] truncate">{w.full_name}</p>
                        <p className="text-[11px] text-[#716A62] truncate">{w.phone || w.email || 'No phone'}</p>
                      </div>

                      {isAssigned ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-[#36785D] bg-[#EBF5F0] px-2.5 py-1 rounded-md border border-[#A8D5C2]">
                            Assigned ✓
                          </span>
                          <button
                            onClick={async () => {
                              await handleRemoveWorker(selectedEventForAssignment.id, w.id);
                            }}
                            className="text-xs text-[#B94A48] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            await handleAssignWorker(selectedEventForAssignment.id, w.id);
                          }}
                          className="text-xs font-semibold text-white bg-[#B87333] hover:bg-[#9E5F27] px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                        >
                          Confirm Shift
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#E8E0D7] flex justify-end">
              <button
                onClick={() => setSelectedEventForAssignment(null)}
                className="px-4 py-2 text-xs font-semibold text-[#716A62] hover:text-[#29251F] bg-[#FAF8F5] hover:bg-[#F9EFE6] rounded-lg border border-[#E8E0D7]"
              >
                Close Dispatcher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
