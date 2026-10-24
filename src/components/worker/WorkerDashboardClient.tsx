/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
  Calendar,
  User,
  MapPin,
  Clock,
  ExternalLink,
  Phone,
  Mail,
  Home,
  CheckCircle2,
  CalendarDays,
  Bell,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
  UserCheck,
  Banknote,
  Check,
  X,
  Briefcase,
  Sparkles,
  Users,
} from 'lucide-react';
import { CateringEvent, Profile, EventAssignment, AppNotification } from '@/types/database';
import { toggleShiftClaim, updateWorkerProfile, markNotificationAsRead } from '@/app/actions/catering';
import { getDaysLeft, formatEventDate } from '@/lib/dateUtils';

interface WorkerDashboardClientProps {
  workerProfile: Profile;
  userEmail: string;
  initialEvents: CateringEvent[];
  myAssignments: EventAssignment[];
  allAssignments?: EventAssignment[];
  initialNotifications: AppNotification[];
}

export default function WorkerDashboardClient({
  workerProfile,
  userEmail,
  initialEvents,
  myAssignments,
  allAssignments,
  initialNotifications,
}: WorkerDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'shifts' | 'upcoming' | 'profile' | 'notifications'>('shifts');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Claim shift state
  const [claimingEventId, setClaimingEventId] = useState<string | null>(null);

  // Notification state
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Confirmed upcoming events for this worker (strictly status === 'confirmed')
  const myConfirmedEvents = initialEvents.filter(
    (e) =>
      myAssignments.some(
        (a) => a.event_id === e.id && a.status === 'confirmed'
      ) && e.status !== 'past'
  );

  // Pending requests for this worker
  const myPendingEvents = initialEvents.filter(
    (e) =>
      myAssignments.some(
        (a) => a.event_id === e.id && a.status === 'pending'
      ) && e.status !== 'past'
  );

  // Available open shifts
  const openShifts = initialEvents.filter((e) => e.status !== 'past');

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateWorkerProfile(formData);

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Worker profile updated successfully!' });
      setIsEditingProfile(false);
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
    setIsSavingProfile(false);
  };

  // Handle Claim Shift Toggle
  const handleToggleClaim = async (eventId: string) => {
    setClaimingEventId(eventId);
    const res = await toggleShiftClaim(eventId);
    if (!res.success) {
      alert(`Shift claim failed: ${res.error}`);
    }
    setClaimingEventId(null);
  };

  // Handle Mark Notification
  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full selection:bg-[#A8D5C2] selection:text-[#282923]">
      {/* ========================================================================= */}
      {/* 1. WELCOME HERO (Warm Hospitality Aesthetic) */}
      {/* ========================================================================= */}
      <section className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#E8E0D7] shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Worker Avatar Initials */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-[#282923] text-[#FAF8F5] font-serif font-bold text-2xl flex items-center justify-center shrink-0 border border-[#E8E0D7] shadow-xs">
              {workerProfile.full_name ? workerProfile.full_name.charAt(0).toUpperCase() : 'W'}
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-[#EBF5F0] text-[#235540] border border-[#A8D5C2]">
                <UserCheck className="w-3.5 h-3.5 text-[#36785D]" />
                <span>Verified Banquet Staff</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#29251F] tracking-tight">
                Welcome, {workerProfile.full_name}
              </h1>
              <p className="text-xs text-[#716A62]">
                {workerProfile.phone ? `📱 ${workerProfile.phone}` : 'Add your contact number in your profile.'} • {userEmail}
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('upcoming')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#B87333] hover:bg-[#9E5F27] text-white shadow-xs transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Confirmed Shifts ({myConfirmedEvents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-[#716A62] hover:text-[#29251F] bg-[#FAF8F5] hover:bg-[#F9EFE6] border border-[#E8E0D7] transition-all"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] rounded-xl p-1.5 border border-[#E8E0D7] shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'shifts'
              ? 'bg-[#B87333] text-white shadow-xs'
              : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Available Job Posts ({openShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'upcoming'
              ? 'bg-[#B87333] text-white shadow-xs'
              : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Confirmed Shifts ({myConfirmedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-[#B87333] text-white shadow-xs'
              : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Worker Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'notifications'
              ? 'bg-[#B87333] text-white shadow-xs'
              : 'text-[#716A62] hover:text-[#29251F] hover:bg-[#FAF8F5]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-[#B94A48] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AVAILABLE CATERING JOBS */}
      {/* ========================================================================= */}
      {activeTab === 'shifts' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#29251F]">Available Catering Shifts</h2>
              <p className="text-xs text-[#716A62]">
                Explore open shifts published by banquet coordinators, review pay rates, and claim your attendance.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#36785D] bg-[#EBF5F0] px-3 py-1 rounded-md border border-[#A8D5C2] self-start sm:self-auto">
              {openShifts.length} Openings Active
            </span>
          </div>

          {openShifts.length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-2xl p-12 text-center border border-[#E8E0D7] shadow-xs">
              <CalendarDays className="w-10 h-10 text-[#716A62]/40 mx-auto mb-3" />
              <h3 className="font-serif text-lg text-[#29251F]">No open shifts posted</h3>
              <p className="text-xs text-[#716A62] mt-1 max-w-sm mx-auto">
                All upcoming events will appear here as soon as event coordinators publish them. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openShifts.map((event) => {
                const daysInfo = getDaysLeft(event.event_date);
                const myAssignment = myAssignments.find((a) => a.event_id === event.id);
                const isPending = myAssignment?.status === 'pending';
                const isConfirmed = myAssignment?.status === 'confirmed';

                // Total confirmed crew across all workers (only status === 'confirmed')
                const confirmedCrewCount = (allAssignments || myAssignments).filter(
                  (a) => a.event_id === event.id && a.status === 'confirmed'
                ).length;

                const maxMembers = event.member_count || 5;
                const isFull = confirmedCrewCount >= maxMembers && !isConfirmed && !isPending;
                const spotsLeft = Math.max(0, maxMembers - confirmedCrewCount);
                const isProcessing = claimingEventId === event.id;

                return (
                  <div
                    key={event.id}
                    className={`bg-[#FFFFFF] rounded-2xl p-6 border transition-all flex flex-col justify-between shadow-xs ${
                      isConfirmed
                        ? 'border-[#A8D5C2] ring-1 ring-[#A8D5C2]'
                        : isPending
                        ? 'border-[#E5C3A5] ring-1 ring-[#E5C3A5]'
                        : 'border-[#E8E0D7] hover:border-[#B87333]/40'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-md border ${daysInfo.badgeClass}`}>
                          {daysInfo.text}
                        </span>

                        {isConfirmed ? (
                          <span className="text-[11px] font-semibold text-[#235540] bg-[#EBF5F0] px-2.5 py-0.5 rounded-md border border-[#A8D5C2] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#36785D]" />
                            Shift Confirmed ✓
                          </span>
                        ) : isPending ? (
                          <span className="text-[11px] font-semibold text-[#B87333] bg-[#F9EFE6] px-2.5 py-0.5 rounded-md border border-[#E5C3A5] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#B87333]" />
                            Request Pending Approval
                          </span>
                        ) : isFull ? (
                          <span className="text-[11px] font-semibold text-[#B94A48] bg-red-50 px-2.5 py-0.5 rounded-md border border-[#B94A48]/30 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-[#B94A48]" />
                            Fully Staffed
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#36785D] bg-[#EBF5F0] px-2.5 py-0.5 rounded-md border border-[#A8D5C2]">
                            {spotsLeft} {spotsLeft === 1 ? 'Spot' : 'Spots'} Left
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <div>
                        <h3 className="font-serif text-xl text-[#29251F] leading-snug">{event.name}</h3>
                        <p className="text-xs text-[#716A62] flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#B87333]" />
                          <span>{event.place}</span>
                        </p>
                      </div>

                      {/* Specs Grid: Date, Duration, Pay Rate */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7] text-xs">
                        <div>
                          <span className="text-[10px] text-[#716A62] block">Event Date</span>
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
                          <span className="text-[10px] text-[#716A62] block">Compensation</span>
                          <span className="font-semibold text-[#36785D] truncate block">
                            {event.salary != null && !isNaN(Number(event.salary))
                              ? `₹${Number(event.salary).toLocaleString('en-IN')}/${event.salary_unit || 'day'}`
                              : 'Standard'}
                          </span>
                        </div>
                      </div>

                      {/* Live Crew Availability Bar (e.g. 5/10) */}
                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7] space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5 text-[#29251F]">
                            <Users className="w-3.5 h-3.5 text-[#B87333]" />
                            <span>Crew Positions:</span>
                          </span>
                          <span className={confirmedCrewCount >= maxMembers ? 'text-[#36785D] font-bold' : 'text-[#B87333]'}>
                            {confirmedCrewCount} / {maxMembers} Confirmed {spotsLeft > 0 ? `(${spotsLeft} open)` : '• Full'}
                          </span>
                        </div>
                        <div className="w-full bg-[#E8E0D7] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              confirmedCrewCount >= maxMembers ? 'bg-[#36785D]' : 'bg-[#B87333]'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.round((confirmedCrewCount / maxMembers) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Google Maps Venue Link */}
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
                        <p className="text-xs text-[#716A62]/60 italic">Venue details provided upon confirmation</p>
                      )}
                    </div>

                    {/* Request / Claim Shift Button */}
                    <div className="mt-5 pt-4 border-t border-[#E8E0D7]">
                      {isConfirmed ? (
                        <button
                          onClick={() => handleToggleClaim(event.id)}
                          disabled={isProcessing}
                          className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 bg-[#EBF5F0] text-[#235540] hover:bg-red-50 hover:text-[#B94A48] border border-[#A8D5C2] hover:border-[#B94A48]/30"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>✓ Confirmed Crew Member (Click to Release)</span>
                          )}
                        </button>
                      ) : isPending ? (
                        <button
                          onClick={() => handleToggleClaim(event.id)}
                          disabled={isProcessing}
                          className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 bg-[#F9EFE6] text-[#B87333] hover:bg-red-50 hover:text-[#B94A48] border border-[#E5C3A5] hover:border-[#B94A48]/30"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>⏳ Request Pending Admin Approval (Click to Cancel)</span>
                          )}
                        </button>
                      ) : isFull ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 bg-[#FAF8F5] text-[#716A62] border border-[#E8E0D7] cursor-not-allowed opacity-75"
                        >
                          <span>Shift Fully Staffed ({confirmedCrewCount}/{maxMembers})</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleClaim(event.id)}
                          disabled={isProcessing}
                          className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 bg-[#B87333] hover:bg-[#9E5F27] text-white shadow-xs"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Request This Shift ({spotsLeft} spots open)</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UPCOMING ASSIGNED SHIFTS (Countdown & Venue) */}
      {/* ========================================================================= */}
      {activeTab === 'upcoming' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#29251F]">Your Confirmed Upcoming Shifts</h2>
            <p className="text-xs text-[#716A62]">
              Track your confirmed assignments, countdown days left, and access directions on event day.
            </p>
          </div>

          {myConfirmedEvents.length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-2xl p-12 text-center border border-[#E8E0D7] shadow-xs">
              <Calendar className="w-10 h-10 text-[#716A62]/40 mx-auto mb-3" />
              <h3 className="font-serif text-lg text-[#29251F]">No upcoming shifts assigned</h3>
              <p className="text-xs text-[#716A62] mt-1 max-w-sm mx-auto">
                You haven&apos;t claimed any shifts yet. Explore open catering posts to book your next shift.
              </p>
              <button
                onClick={() => setActiveTab('shifts')}
                className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-[#B87333] text-white hover:bg-[#9E5F27]"
              >
                Browse Open Shifts
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myConfirmedEvents.map((event) => {
                const daysInfo = getDaysLeft(event.event_date);

                return (
                  <div
                    key={event.id}
                    className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#A8D5C2] shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-md border ${daysInfo.badgeClass}`}>
                          ⏳ {daysInfo.text}
                        </span>

                        <span className="text-[10px] font-semibold text-[#235540] bg-[#EBF5F0] px-2.5 py-0.5 rounded-md border border-[#A8D5C2]">
                          Confirmed by Client
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif text-xl text-[#29251F] leading-snug">{event.name}</h3>
                        <p className="text-xs text-[#716A62] flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#B87333]" />
                          <span>{event.place}</span>
                        </p>
                      </div>

                      {/* Specs */}
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

                      {/* Map Navigation Link */}
                      {event.venue_map_url && (
                        <a
                          href={event.venue_map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-semibold text-[#235540] bg-[#EBF5F0] hover:bg-[#A8D5C2]/40 px-3.5 py-2 rounded-lg border border-[#A8D5C2] transition-all"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#36785D]" />
                          <span>Navigate to Venue with Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#E8E0D7] flex items-center justify-between text-xs text-[#716A62]">
                      <span>Staff Member: <strong className="text-[#29251F]">{workerProfile.full_name}</strong></span>
                      <span className="text-[#36785D] font-semibold">Attendance Logged</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pending Shift Requests (Awaiting Admin Confirmation) */}
          {myPendingEvents.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-[#E8E0D7]">
              <div>
                <h3 className="font-serif text-xl text-[#29251F] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#B87333]" />
                  <span>Pending Shift Requests ({myPendingEvents.length})</span>
                </h3>
                <p className="text-xs text-[#716A62]">
                  Requests submitted and awaiting administrator approval.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPendingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E5C3A5] bg-[#FAF8F5]/50 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#B87333] bg-[#F9EFE6] px-2.5 py-0.5 rounded-md border border-[#E5C3A5]">
                          ⏳ Awaiting Admin Approval
                        </span>
                        <span className="text-xs text-[#716A62]">
                          {formatEventDate(event.event_date)}
                        </span>
                      </div>
                      <h4 className="font-serif text-lg text-[#29251F]">{event.name}</h4>
                      <p className="text-xs text-[#716A62]">{event.place}</p>
                    </div>

                    <div className="pt-3 border-t border-[#E8E0D7] flex items-center justify-between">
                      <span className="text-xs text-[#716A62]">Status: In Review</span>
                      <button
                        onClick={() => handleToggleClaim(event.id)}
                        className="text-xs text-[#B94A48] hover:underline font-semibold"
                      >
                        Cancel Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORKER PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#E8E0D7] shadow-xs max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D7]">
            <div>
              <span className="text-[10px] font-semibold text-[#B87333] uppercase tracking-wider block">
                Account Details
              </span>
              <h2 className="font-serif text-2xl text-[#29251F] mt-0.5">
                Staff Profile Information
              </h2>
              <p className="text-xs text-[#716A62] mt-0.5">
                Keep your mobile phone and address accurate so event coordinators can verify shift assignments.
              </p>
            </div>

            <button
              onClick={() => {
                setIsEditingProfile(!isEditingProfile);
                setProfileMsg(null);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FAF8F5] text-[#716A62] hover:text-[#29251F] border border-[#E8E0D7] hover:border-[#B87333]/40 transition-colors"
            >
              {isEditingProfile ? 'Cancel' : 'Edit Information'}
            </button>
          </div>

          {profileMsg && (
            <div
              className={`p-3.5 rounded-xl flex items-start gap-2.5 border text-xs font-medium ${
                profileMsg.type === 'success'
                  ? 'bg-[#EBF5F0] border-[#A8D5C2] text-[#235540]'
                  : 'bg-red-50/70 border-[#B94A48]/30 text-[#B94A48]'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#36785D] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#B94A48] shrink-0 mt-0.5" />
              )}
              <div>{profileMsg.text}</div>
            </div>
          )}

          {isEditingProfile ? (
            /* Edit Form */
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="full_name" className="block text-xs font-semibold text-[#29251F]">
                  Full Name <span className="text-[#B94A48]">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  required
                  type="text"
                  defaultValue={workerProfile.full_name}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="phone" className="block text-xs font-semibold text-[#29251F]">
                  Mobile Number
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#716A62]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={workerProfile.phone || ''}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="address" className="block text-xs font-semibold text-[#29251F]">
                  Residential Address
                </label>
                <div className="relative rounded-lg">
                  <div className="absolute top-3 left-0 pl-3.5 flex items-center pointer-events-none text-[#716A62]">
                    <Home className="h-4 w-4" />
                  </div>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    defaultValue={workerProfile.address || ''}
                    placeholder="Enter street, area, and city address..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#E8E0D7] text-sm text-[#29251F] bg-white focus:border-[#B87333] focus:ring-2 focus:ring-[#B87333]/15 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#716A62]">Account Email</label>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E8E0D7] text-xs text-[#716A62]">
                  <Mail className="w-4 h-4 text-[#716A62]" />
                  <span>{userEmail} (Verified Auth)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#B87333] hover:bg-[#9E5F27] disabled:opacity-50 shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </form>
          ) : (
            /* Read-Only Profile Card */
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#282923] text-[#FAF8F5] font-serif font-bold text-2xl flex items-center justify-center shrink-0 border border-[#E8E0D7]">
                  {workerProfile.full_name ? workerProfile.full_name.charAt(0).toUpperCase() : 'W'}
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif text-xl text-[#29251F]">{workerProfile.full_name}</h3>
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#EBF5F0] text-[#235540] border border-[#A8D5C2] uppercase tracking-wider">
                    Catering Staff Member
                  </span>
                  <p className="text-xs text-[#716A62]">
                    Member since {new Date(workerProfile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E8E0D7] text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7]">
                  <span className="text-[10px] font-semibold text-[#716A62] uppercase tracking-wider block">Gmail / Email</span>
                  <p className="font-semibold text-[#29251F] mt-1 flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#B87333] shrink-0" />
                    <span className="truncate">{workerProfile.email || userEmail}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7]">
                  <span className="text-[10px] font-semibold text-[#716A62] uppercase tracking-wider block">Mobile Phone</span>
                  <p className="font-semibold text-[#29251F] mt-1 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#B87333] shrink-0" />
                    <span>{workerProfile.phone || 'Not provided'}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E0D7] sm:col-span-2">
                  <span className="text-[10px] font-semibold text-[#716A62] uppercase tracking-wider block">Residential Address</span>
                  <p className="font-medium text-[#29251F] mt-1 flex items-start gap-2">
                    <Home className="w-3.5 h-3.5 text-[#B87333] shrink-0 mt-0.5" />
                    <span>{workerProfile.address || 'No residential address on file.'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHIFT NOTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#E8E0D7] shadow-xs max-w-2xl mx-auto space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D7]">
            <div>
              <span className="text-[10px] font-semibold text-[#B87333] uppercase tracking-wider block">
                Inbox
              </span>
              <h2 className="font-serif text-2xl text-[#29251F] mt-0.5">
                Shift & Schedule Alerts
              </h2>
            </div>

            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-[#235540] bg-[#EBF5F0] px-2.5 py-0.5 rounded-md border border-[#A8D5C2]">
                {unreadCount} Unread
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-[#716A62]">
              <Bell className="w-10 h-10 text-[#716A62]/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#29251F]">No notifications</p>
              <p className="text-xs text-[#716A62] mt-0.5">You will receive alerts here when coordinators post new shifts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                    notif.is_read
                      ? 'bg-[#FAF8F5]/60 border-[#E8E0D7] text-[#716A62]'
                      : 'bg-[#F9EFE6]/50 border-[#E5C3A5] text-[#29251F]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#B87333] shrink-0"></span>}
                      <h4 className="font-semibold text-[#29251F]">{notif.title}</h4>
                    </div>
                    <p className="text-[#716A62] leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-[#716A62]/70 block">
                      {new Date(notif.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-xs font-semibold text-[#B87333] hover:underline shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
