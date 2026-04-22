import type { ContactRow, EventRow } from '../types/database';

// Row shape for the exported sheet. Keep the column order stable — users
// build spreadsheets on top of it.
interface ExportRow {
  Name: string;
  Title: string;
  Company: string;
  Email: string;
  Phone: string;
  Website: string;
  LinkedIn: string;
  Address: string;
  Event: string;
  'Event Location': string;
  'Event Date': string;
  'Follow-up Status': string;
  'Voice Note URL': string;
  'Voice Note': string;
  'Front Image URL': string;
  'Back Image URL': string;
  'Captured At': string;
  'Last Updated At': string;
}

function toRow(contact: ContactRow, event?: EventRow): ExportRow {
  return {
    Name: contact.full_name,
    Title: contact.title ?? '',
    Company: contact.company ?? '',
    Email: contact.email ?? '',
    Phone: contact.phone ?? '',
    Website: contact.website ?? '',
    LinkedIn: contact.linkedin ?? '',
    Address: contact.address ?? '',
    Event: event?.name ?? '',
    'Event Location': event?.location ?? '',
    'Event Date': event?.date ?? '',
    'Follow-up Status': contact.follow_up_status,
    'Voice Note URL': contact.voice_note_url ?? '',
    'Voice Note': contact.voice_note_transcript ?? '',
    'Front Image URL': contact.front_image_url ?? '',
    'Back Image URL': contact.back_image_url ?? '',
    'Captured At': new Date(contact.created_at).toLocaleString(),
    'Last Updated At': new Date(contact.updated_at).toLocaleString(),
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportContactsToExcel(
  contacts: ContactRow[],
  events: EventRow[] = [],
  filename = `cardify-contacts-${new Date().toISOString().slice(0, 10)}.xlsx`,
) {
  // Dynamic import keeps ~400KB of xlsx out of the initial bundle.
  const XLSX = await import('xlsx');
  const eventMap = new Map(events.map((e) => [e.id, e]));
  const rows = contacts.map((c) => toRow(c, c.event_id ? eventMap.get(c.event_id) : undefined));

  const sheet = XLSX.utils.json_to_sheet(rows);
  // Rough column widths so the file opens readable.
  sheet['!cols'] = [
    { wch: 22 }, // Name
    { wch: 22 }, // Title
    { wch: 22 }, // Company
    { wch: 28 }, // Email
    { wch: 16 }, // Phone
    { wch: 24 }, // Website
    { wch: 30 }, // LinkedIn
    { wch: 28 }, // Address
    { wch: 22 }, // Event
    { wch: 22 }, // Event Location
    { wch: 12 }, // Event Date
    { wch: 14 }, // Follow-up
    { wch: 36 }, // Voice URL
    { wch: 40 }, // Voice
    { wch: 36 }, // Front image
    { wch: 36 }, // Back image
    { wch: 20 }, // Captured At
    { wch: 20 }, // Updated At
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Contacts');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename,
  );
}
