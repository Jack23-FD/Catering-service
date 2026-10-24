export type UserRole = 'worker' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export type EventStatus = 'upcoming' | 'current' | 'past';

export interface CateringEvent {
  id: string;
  name: string;
  event_date: string;
  place: string;
  food: string;
  days: number;
  hours: string;
  salary?: number | null;
  salary_unit?: string | null;
  venue_map_url?: string;
  collaborator?: string;
  status: EventStatus;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  assignments_count?: number;
  is_assigned_to_me?: boolean;
}

export interface EventAssignment {
  id: string;
  event_id: string;
  worker_id: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  event?: CateringEvent;
  worker?: Profile;
}

export interface AppNotification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
