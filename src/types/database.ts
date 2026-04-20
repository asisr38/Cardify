// Hand-written types that mirror the SQL schema in
// supabase/migrations/001_initial_schema.sql. Once you're ready, replace this
// file with the CLI-generated types:
//
//   npx supabase gen types typescript --project-id <ref> --schema public \
//     > src/types/database.ts
//
// Until then, keep this file in sync whenever the schema changes.

export type FollowUpStatus = 'pending' | 'sent' | 'skipped';
export type InteractionType = 'email_sent' | 'note' | 'call' | 'meeting';

export interface EventRow {
  id: string;
  user_id: string;
  name: string;
  date: string; // ISO date (YYYY-MM-DD) from Postgres `date` column
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Pick<EventRow, 'name' | 'date'> & {
  user_id: string;
  location?: string | null;
  is_active?: boolean;
};

export type EventUpdate = Partial<
  Pick<EventRow, 'name' | 'date' | 'location' | 'is_active'>
>;

export interface EventStatsRow {
  event_id: string;
  user_id: string;
  contact_count: number;
  sent_count: number;
  pending_count: number;
  skipped_count: number;
}

export interface ContactRow {
  id: string;
  user_id: string;
  event_id: string | null;
  full_name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin: string | null;
  address: string | null;
  voice_note_url: string | null;
  voice_note_transcript: string | null;
  front_image_url: string | null;
  back_image_url: string | null;
  follow_up_status: FollowUpStatus;
  created_at: string;
  updated_at: string;
}

export type ContactInsert = Omit<ContactRow, 'id' | 'created_at' | 'updated_at' | 'follow_up_status'> & {
  follow_up_status?: FollowUpStatus;
};

export type ContactUpdate = Partial<
  Omit<ContactRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export interface InteractionRow {
  id: string;
  contact_id: string;
  user_id: string;
  type: InteractionType;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type InteractionInsert = Omit<InteractionRow, 'id' | 'created_at' | 'metadata'> & {
  metadata?: Record<string, unknown>;
};

export interface EmailTemplateRow {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type EmailTemplateInsert = Pick<EmailTemplateRow, 'name' | 'subject' | 'body'> & {
  user_id: string;
  is_default?: boolean;
};

export type EmailTemplateUpdate = Partial<
  Pick<EmailTemplateRow, 'name' | 'subject' | 'body' | 'is_default'>
>;
