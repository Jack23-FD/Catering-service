'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to check if current user is admin
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: Please log in.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Forbidden: Admin access required.');
  }

  return { supabase, user };
}

// Helper to check authenticated user
async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized: Please log in.');
  return { supabase, user };
}

// 1. Create Event Post (Admin Only)
export async function createEventPost(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const name = formData.get('name') as string;
  const event_date = formData.get('event_date') as string;
  const place = formData.get('place') as string;
  const days = parseInt((formData.get('days') as string) || '1', 10);
  const memberCountRaw = (formData.get('member_count') as string)?.trim();
  const parsedMemberCount = parseInt(memberCountRaw || '5', 10);
  const member_count = isNaN(parsedMemberCount) || parsedMemberCount < 1 ? 5 : parsedMemberCount;
  const salaryRaw = (formData.get('salary') as string)?.trim();
  const salary = salaryRaw ? parseFloat(salaryRaw) : null;
  const salary_unit = ((formData.get('salary_unit') as string) || 'day').trim().toLowerCase();
  const venue_map_url = (formData.get('venue_map_url') as string) || '';

  if (!name || !event_date || !place) {
    return { success: false, error: 'Please fill in Event Name, Date, and Place.' };
  }

  // Auto-determine status from event date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const evDate = new Date(event_date);
  evDate.setHours(0, 0, 0, 0);

  let status: 'upcoming' | 'current' | 'past' = 'upcoming';
  if (evDate.getTime() < today.getTime()) {
    status = 'past';
  } else if (evDate.getTime() === today.getTime()) {
    status = 'current';
  } else {
    status = 'upcoming';
  }

  const insertPayload: Record<string, unknown> = {
    name: name.trim(),
    event_date,
    place: place.trim(),
    food: 'Catering Service',
    days: isNaN(days) || days < 1 ? 1 : days,
    hours: 'Standard Shift',
    venue_map_url: venue_map_url.trim() || null,
    collaborator: null,
    status,
    created_by: user.id,
    salary: salary !== null && !isNaN(salary) ? salary : null,
    salary_unit: salary_unit || 'day',
    member_count,
  };

  let { data: event, error } = await supabase
    .from('events')
    .insert(insertPayload)
    .select()
    .single();

  // If columns don't exist yet in Supabase schema, retry with graceful fallbacks
  if (error && (error.message?.toLowerCase().includes('column "member_count"') || error.message?.toLowerCase().includes('column "salary"'))) {
    if (error.message?.toLowerCase().includes('column "member_count"')) {
      delete insertPayload.member_count;
    }
    if (error.message?.toLowerCase().includes('column "salary"')) {
      delete insertPayload.salary;
      delete insertPayload.salary_unit;
    }
    const retry = await supabase.from('events').insert(insertPayload).select().single();
    if (retry.error) {
      return { success: false, error: retry.error.message };
    }
    event = retry.data;
  } else if (error) {
    return { success: false, error: error.message };
  }

  // Create broadcast notification for all workers
  await supabase.from('notifications').insert({
    title: `New Event: ${name}`,
    message: `A new catering event at ${place} on ${event_date} (${member_count} positions) has been posted. Request your shift now!`,
    is_read: false,
  });

  revalidatePath('/admin/dashboard');
  revalidatePath('/worker/dashboard');
  return { success: true, event };
}

// 2. Delete Event Post (Admin Only)
export async function deleteEventPost(eventId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/dashboard');
  revalidatePath('/worker/dashboard');
  return { success: true };
}

// 3. Directly Assign Worker to Event (Admin Only)
export async function assignWorkerToEvent(eventId: string, workerId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('event_assignments')
    .upsert({
      event_id: eventId,
      worker_id: workerId,
      status: 'confirmed',
    }, { onConflict: 'event_id,worker_id' });

  if (error) return { success: false, error: error.message };

  // Fetch event name for notification
  const { data: event } = await supabase
    .from('events')
    .select('name, event_date')
    .eq('id', eventId)
    .single();

  // Notify worker
  if (event) {
    await supabase.from('notifications').insert({
      user_id: workerId,
      title: 'Shift Confirmed!',
      message: `You have been confirmed for the event: ${event.name} on ${event.event_date}.`,
      is_read: false,
    });
  }

  revalidatePath('/admin/dashboard');
  revalidatePath('/worker/dashboard');
  return { success: true };
}

// 4. Remove Worker from Event (Admin Only)
export async function removeWorkerFromEvent(eventId: string, workerId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('event_assignments')
    .delete()
    .eq('event_id', eventId)
    .eq('worker_id', workerId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/dashboard');
  revalidatePath('/worker/dashboard');
  return { success: true };
}

// 5. Worker Requests or Cancels a Shift
export async function toggleShiftClaim(eventId: string) {
  const { supabase, user } = await requireUser();

  // Check if existing record
  const { data: existing } = await supabase
    .from('event_assignments')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('worker_id', user.id)
    .maybeSingle();

  if (existing) {
    // Cancel existing request or assignment
    const { error } = await supabase
      .from('event_assignments')
      .delete()
      .eq('id', existing.id);

    if (error) return { success: false, error: error.message };
    revalidatePath('/worker/dashboard');
    revalidatePath('/admin/dashboard');
    return { success: true, claimed: false, status: 'none' };
  } else {
    // Check if event is fully staffed
    const { data: eventData } = await supabase
      .from('events')
      .select('name, member_count')
      .eq('id', eventId)
      .single();

    const maxMembers = eventData?.member_count || 5;
    const { count: confirmedCount } = await supabase
      .from('event_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    if ((confirmedCount || 0) >= maxMembers) {
      return { success: false, error: `This shift is already fully staffed (${maxMembers}/${maxMembers} spots filled).` };
    }

    // Submit request strictly with status 'pending' (Awaiting Admin Approval)
    const { error } = await supabase
      .from('event_assignments')
      .insert({
        event_id: eventId,
        worker_id: user.id,
        status: 'pending',
      });

    if (error) {
      if (error.message?.toLowerCase().includes('status') || error.message?.toLowerCase().includes('check')) {
        return {
          success: false,
          error: 'Please execute the 2-line SQL migration in Supabase SQL editor to enable the "pending" request status: ALTER TABLE public.event_assignments DROP CONSTRAINT IF EXISTS event_assignments_status_check; ALTER TABLE public.event_assignments ADD CONSTRAINT event_assignments_status_check CHECK (status IN (\'pending\', \'confirmed\', \'completed\', \'cancelled\', \'rejected\'));',
        };
      }
      return { success: false, error: error.message };
    }

    // Fetch worker name for notification
    const { data: workerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    // Broadcast alert to admin
    await supabase.from('notifications').insert({
      title: `Shift Request: ${eventData?.name || 'Event'}`,
      message: `${workerProfile?.full_name || 'A worker'} submitted a request to join "${eventData?.name || 'Event'}". Review and accept in Job Requests.`,
      is_read: false,
    });

    revalidatePath('/worker/dashboard');
    revalidatePath('/admin/dashboard');
    return { success: true, claimed: true, status: 'pending' };
  }
}

// 6. Admin Approves a Worker's Shift Request
export async function approveShiftRequest(assignmentId: string) {
  const { supabase } = await requireAdmin();

  // Fetch assignment & event
  const { data: assignment, error: fetchErr } = await supabase
    .from('event_assignments')
    .select('*, event:events(*), worker:profiles(*)')
    .eq('id', assignmentId)
    .single();

  if (fetchErr || !assignment) return { success: false, error: 'Assignment record not found.' };

  // Check event capacity
  const maxMembers = assignment.event?.member_count || 5;
  const { count: confirmedCount } = await supabase
    .from('event_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', assignment.event_id)
    .eq('status', 'confirmed');

  if ((confirmedCount || 0) >= maxMembers) {
    return {
      success: false,
      error: `Cannot accept: Event is already fully staffed (${maxMembers}/${maxMembers} positions confirmed).`,
    };
  }

  const { error } = await supabase
    .from('event_assignments')
    .update({ status: 'confirmed' })
    .eq('id', assignmentId);

  if (error) return { success: false, error: error.message };

  // Notify the worker
  await supabase.from('notifications').insert({
    user_id: assignment.worker_id,
    title: 'Shift Request Approved! 🎉',
    message: `Your shift request for "${assignment.event?.name}" on ${assignment.event?.event_date} has been accepted! You are confirmed for this event.`,
    is_read: false,
  });

  revalidatePath('/admin/dashboard');
  revalidatePath('/worker/dashboard');
  return { success: true };
}

// 7. Admin Rejects a Worker's Shift Request
export async function rejectShiftRequest(assignmentId: string) {
  const { supabase } = await requireAdmin();

  const { data: assignment } = await supabase
    .from('event_assignments')
    .select('*, event:events(*)')
    .eq('id', assignmentId)
    .single();

  const { error } = await supabase
    .from('event_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) return { success: false, error: error.message };

  if (assignment) {
    await supabase.from('notifications').insert({
      user_id: assignment.worker_id,
      title: 'Shift Request Update',
      message: `Your request for "${assignment.event?.name}" could not be confirmed at this time.`,
      is_read: false,
    });
  }

  revalidatePath('/admin/dashboard');
  revalidatePath('/worker/dashboard');
  return { success: true };
}

// 6. Update Worker Profile (Self or Admin)
export async function updateWorkerProfile(formData: FormData) {
  const { supabase, user } = await requireUser();

  const full_name = formData.get('full_name') as string;
  const phone = (formData.get('phone') as string) || '';
  const address = (formData.get('address') as string) || '';
  const avatar_url = (formData.get('avatar_url') as string) || '';

  if (!full_name || full_name.trim().length < 2) {
    return { success: false, error: 'Full name must be at least 2 characters.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: full_name.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      avatar_url: avatar_url.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/worker/dashboard');
  revalidatePath('/admin/dashboard');
  return { success: true };
}

// 7. Mark Notification as Read
export async function markNotificationAsRead(notificationId: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/worker/dashboard');
  return { success: true };
}
