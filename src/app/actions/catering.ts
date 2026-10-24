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
  };

  let { data: event, error } = await supabase
    .from('events')
    .insert(insertPayload)
    .select()
    .single();

  // If column doesn't exist yet in Supabase schema, retry without salary columns
  if (error && error.message?.toLowerCase().includes('column "salary"')) {
    delete insertPayload.salary;
    delete insertPayload.salary_unit;
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
    message: `A new catering event at ${place} on ${event_date} has been posted. Claim your shift now!`,
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

// 3. Assign Worker to Event (Admin Only)
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

// 5. Worker Claims or Unclaims a Shift (Worker Only)
export async function toggleShiftClaim(eventId: string) {
  const { supabase, user } = await requireUser();

  // Check if currently assigned
  const { data: existing } = await supabase
    .from('event_assignments')
    .select('id')
    .eq('event_id', eventId)
    .eq('worker_id', user.id)
    .maybeSingle();

  if (existing) {
    // Unclaim
    const { error } = await supabase
      .from('event_assignments')
      .delete()
      .eq('id', existing.id);

    if (error) return { success: false, error: error.message };
  } else {
    // Claim shift
    const { error } = await supabase
      .from('event_assignments')
      .insert({
        event_id: eventId,
        worker_id: user.id,
        status: 'confirmed',
      });

    if (error) return { success: false, error: error.message };
  }

  revalidatePath('/worker/dashboard');
  revalidatePath('/admin/dashboard');
  return { success: true, claimed: !existing };
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
