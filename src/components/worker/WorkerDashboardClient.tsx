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
  Camera,
  Layers,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { CateringEvent, Profile, EventAssignment, AppNotification } from '@/types/database';
import { toggleShiftClaim, updateWorkerProfile, markNotificationAsRead } from '@/app/actions/catering';
import { getDaysLeft, formatEventDate } from '@/lib/dateUtils';

interface WorkerDashboardClientProps {
  workerProfile: Profile;
  userEmail: string;
  initialEvents: CateringEvent[];
  myAssignments: EventAssignment[];
  initialNotifications: AppNotification[];
}

export default function WorkerDashboardClient({
  workerProfile,
  userEmail,
  initialEvents,
  myAssignments,
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

  // Set of event IDs assigned to this worker
  const myAssignedEventIds = new Set(myAssignments.map((a) => a.event_id));

  // Confirmed upcoming events for this worker
  const myConfirmedEvents = initialEvents.filter(
    (e) => myAssignedEventIds.has(e.id) && e.status !== 'past'
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
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
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
      alert(`Shift update failed: ${res.error}`);
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
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <section className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-800">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 p-1 shrink-0 overflow-hidden shadow-lg">
              {workerProfile.avatar_url ? (
                <img
                  src={workerProfile.avatar_url}
                  alt={workerProfile.full_name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-2xl">
                  {workerProfile.full_name ? workerProfile.full_name.charAt(0).toUpperCase() : 'W'}
                </div>
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30 mb-2">
                <UserCheck className="w-4 h-4 text-purple-300" />
                <span>Verified Catering Worker</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {workerProfile.full_name}!
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-purple-200">
                {workerProfile.phone ? `📱 ${workerProfile.phone}` : 'Add your mobile number to receive shift updates.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('profile')}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/40 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>My Confirmed Events ({myConfirmedEvents.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-purple-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'shifts'
              ? 'bg-purple-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Available Event Posts ({openShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'upcoming'
              ? 'bg-purple-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Upcoming Event Tracking ({myConfirmedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-purple-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Worker Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'notifications'
              ? 'bg-purple-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: EVENT POST (ADMIN-ENTERED DATA) */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Live Catering Event Postings</h2>
              <p className="text-xs text-gray-500">
                Browse open events published by coordinators, view full catering details, and claim your shifts.
              </p>
            </div>
          </div>

          {openShifts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm">
              <CalendarDays className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No active catering posts</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                All upcoming events will appear here as soon as the administrator publishes them. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {openShifts.map((event) => {
                const daysInfo = getDaysLeft(event.event_date);
                const isClaimed = myAssignedEventIds.has(event.id);
                const isProcessing = claimingEventId === event.id;

                return (
                  <div
                    key={event.id}
                    className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                      isClaimed ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-purple-100'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-xs px-3 py-1 rounded-full border ${daysInfo.badgeClass}`}>
                          {daysInfo.text}
                        </span>

                        {isClaimed && (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Confirmed Shift
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <h3 className="text-lg font-bold text-gray-900">{event.name}</h3>

                      {/* Event Details: Date, Place, Days */}
                      <div className="mt-4 grid grid-cols-3 gap-2.5 text-xs text-gray-700 bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-semibold text-gray-900 truncate">{formatEventDate(event.event_date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-medium truncate">{event.place}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-bold text-purple-900 truncate">
                            {event.days} {event.days === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                      </div>

                      {/* Venue Google Maps Location */}
                      {event.venue_map_url ? (
                        <a
                          href={event.venue_map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline"
                        >
                          <MapPin className="w-3.5 h-3.5 text-purple-600" />
                          View Venue on Google Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="mt-3 text-xs text-gray-400 italic">No Google Maps link attached</p>
                      )}
                    </div>

                    {/* Claim / Unclaim Action Button */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleClaim(event.id)}
                        disabled={isProcessing}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          isClaimed
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-rose-50 hover:text-rose-700 border border-emerald-200 hover:border-rose-200'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-900/30'
                        }`}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isClaimed ? (
                          <>
                            <span>Shift Claimed ✓ (Click to Cancel)</span>
                          </>
                        ) : (
                          <>
                            <span>Claim This Shift</span>
                            <ArrowRight className="w-4 h-4" />
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
      )}

      {/* TAB 2: UPCOMING EVENT TRACKING & DAYS LEFT */}
      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your Confirmed Upcoming Shifts</h2>
              <p className="text-xs text-gray-500">
                Track your active assignments and countdown days left until event execution.
              </p>
            </div>
          </div>

          {myConfirmedEvents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm">
              <Calendar className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No confirmed upcoming events</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                You haven&apos;t claimed any shifts yet. Explore open catering event postings to start working.
              </p>
              <button
                onClick={() => setActiveTab('shifts')}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500"
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
                    className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Requirement: Tracking Days Left */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs px-3.5 py-1.5 rounded-full border shadow-xs ${daysInfo.badgeClass}`}>
                          ⏳ {daysInfo.text}
                        </span>

                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Confirmed by Client
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900">{event.name}</h3>

                      {/* Event Details: Date, Place, Days */}
                      <div className="mt-4 bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100 grid grid-cols-3 gap-2.5 text-xs text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="font-bold text-gray-900 truncate">{formatEventDate(event.event_date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="truncate">{event.place}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="font-bold text-emerald-950 truncate">
                            {event.days} {event.days === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                      </div>

                      {/* Maps link */}
                      {event.venue_map_url && (
                        <a
                          href={event.venue_map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 px-3.5 py-2 rounded-xl transition-all"
                        >
                          <MapPin className="w-4 h-4 text-emerald-700" />
                          <span>Navigate to Venue with Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>Assigned Worker: {workerProfile.full_name}</span>
                      <span className="text-emerald-700 font-semibold">Attendance Registered</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WORKER PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="w-6 h-6 text-purple-700" />
                Worker Profile Details
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Keep your contact info and photo updated so coordinators can reach you for shifts.
              </p>
            </div>

            <button
              onClick={() => {
                setIsEditingProfile(!isEditingProfile);
                setProfileMsg(null);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              {isEditingProfile ? 'Cancel Editing' : 'Edit Information'}
            </button>
          </div>

          {profileMsg && (
            <div
              className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="text-sm font-medium">{profileMsg.text}</div>
            </div>
          )}

          {isEditingProfile ? (
            /* Edit Form */
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Profile Photo URL */}
              <div>
                <label htmlFor="avatar_url" className="block text-xs font-semibold text-gray-700 mb-1">
                  Profile Photo URL
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                    <Camera className="h-4 w-4" />
                  </div>
                  <input
                    id="avatar_url"
                    name="avatar_url"
                    type="url"
                    defaultValue={workerProfile.avatar_url || ''}
                    placeholder="https://images.unsplash.com/... or direct image link"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="full_name" className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  required
                  type="text"
                  defaultValue={workerProfile.full_name}
                  className="w-full px-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={workerProfile.phone || ''}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Address
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute top-3 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                    <Home className="h-4 w-4" />
                  </div>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    defaultValue={workerProfile.address || ''}
                    placeholder="Enter street, apartment, and city address..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Gmail Display Only */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gmail / Account Email</label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <span>{userEmail} (Managed via Authentication)</span>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full mt-4 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 shadow-md shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </form>
          ) : (
            /* Read-Only Profile Card */
            <div className="space-y-6">
              {/* Profile Photo Display */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-24 h-24 rounded-3xl bg-purple-100 text-purple-800 font-extrabold flex items-center justify-center text-3xl overflow-hidden border-4 border-purple-200 shadow-md shrink-0">
                  {workerProfile.avatar_url ? (
                    <img
                      src={workerProfile.avatar_url}
                      alt={workerProfile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    workerProfile.full_name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="text-center sm:text-left space-y-1">
                  <h3 className="text-xl font-bold text-gray-900">{workerProfile.full_name}</h3>
                  <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                    Catering Worker Member
                  </span>
                  <p className="text-xs text-gray-500 pt-1">
                    Member since{' '}
                    {new Date(workerProfile.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Profile Fields List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-sm">
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Gmail / Email
                  </span>
                  <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="truncate">{workerProfile.email || userEmail}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Mobile Number
                  </span>
                  <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{workerProfile.phone || 'Not provided'}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 sm:col-span-2">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Residential Address
                  </span>
                  <p className="font-semibold text-gray-900 mt-0.5 flex items-start gap-2">
                    <Home className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>{workerProfile.address || 'No address provided yet.'}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-6 h-6 text-purple-700" />
                Shift & Event Notifications
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Stay informed with shift updates, client confirmations, and event schedules.
              </p>
            </div>

            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                {unreadCount} Unread
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Bell className="w-12 h-12 text-purple-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-800">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                You will be notified here whenever new events or shift assignments arrive.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    notif.is_read
                      ? 'bg-gray-50/60 border-gray-200 text-gray-600'
                      : 'bg-purple-50/80 border-purple-200 text-purple-950 font-medium'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!notif.is_read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>}
                      <h4 className="text-sm font-bold">{notif.title}</h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-gray-400 block pt-1">
                      {new Date(notif.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-xs font-semibold text-purple-700 hover:underline shrink-0"
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
