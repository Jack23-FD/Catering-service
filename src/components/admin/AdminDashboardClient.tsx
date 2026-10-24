/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { CateringEvent, Profile, EventAssignment } from '@/types/database';
import { createEventPost, deleteEventPost, assignWorkerToEvent, removeWorkerFromEvent } from '@/app/actions/catering';
import { getDaysLeft, formatEventDate } from '@/lib/dateUtils';

interface AdminDashboardClientProps {
  adminProfile: Profile;
  initialEvents: CateringEvent[];
  initialWorkers: Profile[];
  initialAssignments: EventAssignment[];
}

export default function AdminDashboardClient({
  adminProfile,
  initialEvents,
  initialWorkers,
  initialAssignments,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'events' | 'workers'>('overview');
  const [eventFilter, setEventFilter] = useState<'all' | 'current' | 'upcoming' | 'past'>('all');
  const [searchWorker, setSearchWorker] = useState('');

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Assignment Modal
  const [selectedEventForAssignment, setSelectedEventForAssignment] = useState<CateringEvent | null>(null);

  // Compute stats
  const totalEvents = initialEvents.length;
  const upcomingEvents = initialEvents.filter((e) => e.status === 'upcoming').length;
  const currentEvents = initialEvents.filter((e) => e.status === 'current').length;
  const pastEvents = initialEvents.filter((e) => e.status === 'past').length;
  const totalWorkers = initialWorkers.length;

  // Filtered events
  const filteredEvents = initialEvents.filter((event) => {
    if (eventFilter !== 'all' && event.status !== eventFilter) return false;
    return true;
  });

  // Filtered workers
  const filteredWorkers = initialWorkers.filter((worker) => {
    const q = searchWorker.toLowerCase();
    return (
      worker.full_name.toLowerCase().includes(q) ||
      (worker.email && worker.email.toLowerCase().includes(q)) ||
      (worker.phone && worker.phone.includes(q)) ||
      (worker.address && worker.address.toLowerCase().includes(q))
    );
  });

  // Handle Event Creation
  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createEventPost(formData);

    if (result.success) {
      setFormMessage({ type: 'success', text: 'Catering Event created successfully!' });
      (e.target as HTMLFormElement).reset();
      setTimeout(() => {
        setActiveTab('events');
      }, 1000);
    } else {
      setFormMessage({ type: 'error', text: result.error || 'Failed to create event.' });
    }
    setIsSubmitting(false);
  };

  // Handle Event Delete
  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"?`)) return;
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

  return (
    <div className="space-y-6">
      {/* Admin Top Header Banner */}
      <section className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-800">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30 mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Platform Administrator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome, {adminProfile.full_name || 'Admin'}!
            </h1>
            <p className="mt-2 text-sm sm:text-base text-purple-200 max-w-xl">
              Manage catering event postings, schedule workers, track event statuses, and monitor workforce bookings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('create')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/40 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event Post</span>
            </button>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-purple-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-purple-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'create'
              ? 'bg-purple-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Event Post</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'events'
              ? 'bg-purple-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Event Details ({totalEvents})</span>
        </button>

        <button
          onClick={() => setActiveTab('workers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'workers'
              ? 'bg-purple-950 text-white shadow-sm'
              : 'text-gray-600 hover:text-purple-900 hover:bg-purple-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Workers Details ({totalWorkers})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-gray-500">Total Events</p>
                <p className="text-xl sm:text-2xl font-extrabold text-purple-950">{totalEvents}</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-gray-500">Upcoming</p>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-700">{upcomingEvents}</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-gray-500">Current</p>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-700">{currentEvents}</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-gray-500">Past Events</p>
                <p className="text-xl sm:text-2xl font-extrabold text-gray-700">{pastEvents}</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3.5 col-span-2 sm:col-span-1">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-gray-500">Workers</p>
                <p className="text-xl sm:text-2xl font-extrabold text-indigo-700">{totalWorkers}</p>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-purple-700" />
                  Upcoming Event Posts
                </h3>
                <button
                  onClick={() => {
                    setEventFilter('upcoming');
                    setActiveTab('events');
                  }}
                  className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {initialEvents.filter((e) => e.status === 'upcoming').length === 0 ? (
                <div className="py-8 text-center text-gray-500 bg-purple-50/50 rounded-2xl border border-dashed border-purple-200">
                  <Calendar className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                  <p className="text-sm">No upcoming events posted yet.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-3 text-xs font-semibold text-purple-700 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-xs hover:bg-purple-50"
                  >
                    + Create First Event
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {initialEvents
                    .filter((e) => e.status === 'upcoming')
                    .slice(0, 3)
                    .map((ev) => {
                      const daysInfo = getDaysLeft(ev.event_date);
                      return (
                        <div
                          key={ev.id}
                          className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/30 flex items-center justify-between"
                        >
                          <div>
                            <h4 className="font-semibold text-sm text-gray-900">{ev.name}</h4>
                            <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                              <span>{formatEventDate(ev.event_date)}</span>
                              <span>•</span>
                              <span>{ev.place}</span>
                            </p>
                          </div>
                          <span className={`text-[11px] px-2.5 py-1 rounded-full border ${daysInfo.badgeClass}`}>
                            {daysInfo.text}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-700" />
                  Registered Workforce Roster
                </h3>
                <button
                  onClick={() => setActiveTab('workers')}
                  className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1"
                >
                  Manage Workers <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {initialWorkers.length === 0 ? (
                <div className="py-8 text-center text-gray-500 bg-purple-50/50 rounded-2xl border border-dashed border-purple-200">
                  <Users className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                  <p className="text-sm">No workers registered yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {initialWorkers.slice(0, 3).map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl border border-gray-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs overflow-hidden">
                          {w.avatar_url ? (
                            <img src={w.avatar_url} alt={w.full_name} className="w-full h-full object-cover" />
                          ) : (
                            w.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{w.full_name}</p>
                          <p className="text-xs text-gray-500">{w.email || 'No email'}</p>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                        {w.phone || 'No phone'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE EVENT POST */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm max-w-3xl mx-auto">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-purple-700" />
              Create New Catering Event Post
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Enter all catering specifications, hours, dates, and venue location for worker shifts.
            </p>
          </div>

          {formMessage && (
            <div
              className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border ${
                formMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {formMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="text-sm font-medium">{formMessage.text}</div>
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="space-y-5">
            {/* 1. Event Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-1">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                type="text"
                placeholder="e.g. Royal Wedding Banquet / Tech Conference Gala"
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm text-gray-900 bg-white placeholder:text-gray-400 font-medium"
              />
            </div>

            {/* 2. Date, Place & Number of Days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="event_date" className="block text-sm font-semibold text-gray-800 mb-1">
                  Event Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="event_date"
                  name="event_date"
                  required
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm text-gray-900 bg-white placeholder:text-gray-400 font-medium"
                />
              </div>

              <div>
                <label htmlFor="place" className="block text-sm font-semibold text-gray-800 mb-1">
                  Place / City <span className="text-red-500">*</span>
                </label>
                <input
                  id="place"
                  name="place"
                  required
                  type="text"
                  placeholder="e.g. Grand Palace Hall, Chennai"
                  className="w-full px-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm text-gray-900 bg-white placeholder:text-gray-400 font-medium"
                />
              </div>

              <div>
                <label htmlFor="days" className="block text-sm font-semibold text-gray-800 mb-1">
                  Number of Days <span className="text-red-500">*</span>
                </label>
                <input
                  id="days"
                  name="days"
                  required
                  type="number"
                  min="1"
                  defaultValue="1"
                  className="w-full px-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm text-gray-900 bg-white placeholder:text-gray-400 font-medium"
                />
              </div>
            </div>

            {/* 3. Venue Google Maps Location */}
            <div>
              <label htmlFor="venue_map_url" className="block text-sm font-semibold text-gray-800 mb-1">
                Venue – Google Maps Location URL
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  id="venue_map_url"
                  name="venue_map_url"
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none text-sm text-gray-900 bg-white placeholder:text-gray-400 font-medium"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Workers can tap this link on their phones to get turn-by-turn navigation directly to the venue.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 shadow-md shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing Event...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Publish Catering Event Post
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: EVENT DETAILS */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(['all', 'upcoming', 'current', 'past'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setEventFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    eventFilter === st
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {st === 'all' ? 'All Events' : `${st} Events`}
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm">
              <CalendarDays className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No events found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No events match your current filter. Post a new catering event or adjust your filter options.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500"
              >
                + Create Event Post
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEvents.map((event) => {
                const daysInfo = getDaysLeft(event.event_date);
                const assignedWorkers = initialAssignments.filter((a) => a.event_id === event.id);

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-xs px-3 py-1 rounded-full border ${daysInfo.badgeClass}`}>
                          {daysInfo.text}
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-md font-semibold uppercase tracking-wider ${
                              event.status === 'upcoming'
                                ? 'bg-amber-100 text-amber-800'
                                : event.status === 'current'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {event.status}
                          </span>

                          <button
                            onClick={() => handleDeleteEvent(event.id, event.name)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-lg font-bold text-gray-900">{event.name}</h3>

                      {/* Event Specs Grid: Date, Place, Days */}
                      <div className="mt-4 grid grid-cols-3 gap-2.5 text-xs text-gray-600 bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-medium truncate">{formatEventDate(event.event_date)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="truncate">{event.place}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="font-semibold text-purple-900">
                            {event.days} {event.days === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                      </div>

                      {/* Google Maps Venue Link */}
                      {event.venue_map_url ? (
                        <a
                          href={event.venue_map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline"
                        >
                          <MapPin className="w-3.5 h-3.5 text-purple-600" />
                          Open Venue in Google Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="mt-3 text-xs text-gray-400 italic">No Google Maps link attached</p>
                      )}

                      {/* Assigned Workers Section */}
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-purple-600" />
                            Assigned Workers ({assignedWorkers.length})
                          </span>
                          <button
                            onClick={() => setSelectedEventForAssignment(event)}
                            className="text-xs font-semibold text-purple-600 hover:underline"
                          >
                            + Assign Worker
                          </button>
                        </div>

                        {assignedWorkers.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No workers assigned to this shift yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assignedWorkers.map((aw) => (
                              <span
                                key={aw.id}
                                className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-purple-200"
                              >
                                <UserCheck className="w-3 h-3 text-purple-600" />
                                {aw.worker?.full_name || 'Worker'}
                                <button
                                  onClick={() => handleRemoveWorker(event.id, aw.worker_id)}
                                  className="text-gray-400 hover:text-red-500 ml-1"
                                  title="Remove from shift"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WORKERS DETAILS */}
      {activeTab === 'workers' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex items-center justify-between">
            <input
              type="text"
              placeholder="Search by worker name, email, phone, or address..."
              value={searchWorker}
              onChange={(e) => setSearchWorker(e.target.value)}
              className="w-full max-w-md px-4 py-2 rounded-xl border border-purple-200 text-sm text-gray-900 bg-white placeholder:text-gray-400 font-medium focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-none"
            />
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 ml-3 shrink-0">
              {filteredWorkers.length} Registered
            </span>
          </div>

          {filteredWorkers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-purple-100 shadow-sm">
              <Users className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No workers found</h3>
              <p className="text-xs text-gray-500 mt-1">No worker records match your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map((worker) => {
                const workerAssignments = initialAssignments.filter((a) => a.worker_id === worker.id);

                return (
                  <div
                    key={worker.id}
                    className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Worker Header (Photo, Name, Role) */}
                      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-800 font-extrabold flex items-center justify-center text-lg overflow-hidden border-2 border-purple-200 shrink-0">
                          {worker.avatar_url ? (
                            <img src={worker.avatar_url} alt={worker.full_name} className="w-full h-full object-cover" />
                          ) : (
                            worker.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-base text-gray-900 truncate">{worker.full_name}</h4>
                          <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            Catering Staff
                          </span>
                        </div>
                      </div>

                      {/* Worker Details List */}
                      <div className="mt-4 space-y-2.5 text-xs">
                        {/* Gmail / Email */}
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="truncate">{worker.email || 'No email specified'}</span>
                        </div>

                        {/* Mobile Number */}
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>{worker.phone || 'No mobile number'}</span>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-2 text-gray-700">
                          <Home className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{worker.address || 'No address provided'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Shifts Footer */}
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Confirmed Shifts</span>
                      <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                        {workerAssignments.length} Events
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUICK ASSIGN WORKER MODAL */}
      {selectedEventForAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-purple-100">
            <h3 className="text-lg font-bold text-gray-900">
              Assign Worker to: {selectedEventForAssignment.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select an available worker to confirm their shift for this catering event.
            </p>

            <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
              {initialWorkers.map((w) => {
                const isAlreadyAssigned = initialAssignments.some(
                  (a) => a.event_id === selectedEventForAssignment.id && a.worker_id === w.id
                );

                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-purple-50/50"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{w.full_name}</p>
                      <p className="text-[11px] text-gray-500">{w.phone || w.email}</p>
                    </div>

                    {isAlreadyAssigned ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        Assigned ✓
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          await handleAssignWorker(selectedEventForAssignment.id, w.id);
                          setSelectedEventForAssignment(null);
                        }}
                        className="text-[11px] font-semibold text-white bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded-lg"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedEventForAssignment(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
