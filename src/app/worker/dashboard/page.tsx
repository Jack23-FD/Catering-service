import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import WorkerDashboardClient from '@/components/worker/WorkerDashboardClient';
import { CateringEvent, Profile, EventAssignment, AppNotification } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function WorkerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/worker/dashboard');
  }

  // 1. Fetch worker profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const workerProfile: Profile = profile || {
    id: user.id,
    full_name: user.user_metadata?.full_name || 'Worker',
    email: user.email,
    role: 'worker',
    created_at: new Date().toISOString(),
  };

  // 2. Fetch available catering events
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (eventsError) {
    console.warn('Events fetch note:', eventsError.message);
  }

  // 3. Fetch this worker's confirmed assignments
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('event_assignments')
    .select('*, event:events(*)')
    .eq('worker_id', user.id);

  if (assignmentsError) {
    console.warn('Worker assignments fetch note:', assignmentsError.message);
  }

  // 4. Fetch notifications for this worker
  const { data: notificationsData, error: notificationsError } = await supabase
    .from('notifications')
    .select('*')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('created_at', { ascending: false });

  if (notificationsError) {
    console.warn('Notifications fetch note:', notificationsError.message);
  }

  const events: CateringEvent[] = (eventsData || []).map((e) => ({
    ...e,
    days: e.days || 1,
  }));

  const myAssignments: EventAssignment[] = assignmentsData || [];
  const notifications: AppNotification[] = notificationsData || [];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col selection:bg-[#A8D5C2] selection:text-[#282923]">
      <Navbar
        userEmail={user.email}
        userName={workerProfile.full_name}
        role={workerProfile.role}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <WorkerDashboardClient
          workerProfile={workerProfile}
          userEmail={user.email || ''}
          initialEvents={events}
          myAssignments={myAssignments}
          initialNotifications={notifications}
        />
      </main>
    </div>
  );
}
