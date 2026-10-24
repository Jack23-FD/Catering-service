import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import { CateringEvent, Profile, EventAssignment } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Server-side session verification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/dashboard');
  }

  // 2. Server-side role authorization
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin') {
    redirect('/worker/dashboard');
  }

  const adminName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Jack-23';

  // 3. Fetch all events
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (eventsError) {
    console.warn('Events fetch note (table may be freshly created):', eventsError.message);
  }

  // 4. Fetch all workers
  const { data: workersData, error: workersError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'worker')
    .order('created_at', { ascending: false });

  if (workersError) {
    console.warn('Workers fetch note:', workersError.message);
  }

  // 5. Fetch all event assignments
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('event_assignments')
    .select('*, worker:profiles(*)')
    .order('created_at', { ascending: false });

  if (assignmentsError) {
    console.warn('Assignments fetch note:', assignmentsError.message);
  }

  const events: CateringEvent[] = (eventsData || []).map((e) => ({
    ...e,
    days: e.days || 1,
  }));

  const workers: Profile[] = workersData || [];
  const assignments: EventAssignment[] = assignmentsData || [];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col selection:bg-[#A8D5C2] selection:text-[#282923]">
      <Navbar
        userEmail={user.email}
        userName={adminName}
        role="admin"
      />

      <div className="flex-1 w-full">
        <AdminDashboardClient
          adminProfile={{
            ...profile,
            full_name: adminName,
          }}
          initialEvents={events}
          initialWorkers={workers}
          initialAssignments={assignments}
        />
      </div>
    </div>
  );
}
