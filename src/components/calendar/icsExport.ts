import type { CalendarEvent } from "../../types/calendar.types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcsDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function toIcsDateOnly(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function rruleFromRecurrence(recurrence?: string): string | null {
  if (!recurrence || recurrence === "none") return null;
  const freq: Record<string, string> = {
    daily: "DAILY",
    weekly: "WEEKLY",
    biweekly: "WEEKLY;INTERVAL=2",
    monthly: "MONTHLY",
  };
  const f = freq[recurrence];
  return f ? `RRULE:FREQ=${f}` : null;
}

function eventToVevent(ev: CalendarEvent): string {
  const lines: string[] = [];
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${ev.id}@hrm-calendar`);

  if (ev.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${toIcsDateOnly(ev.start)}`);
    const endDate = new Date(ev.end);
    endDate.setDate(endDate.getDate() + 1);
    lines.push(`DTEND;VALUE=DATE:${toIcsDateOnly(endDate)}`);
  } else {
    lines.push(`DTSTART:${toIcsDate(ev.start)}`);
    lines.push(`DTEND:${toIcsDate(ev.end)}`);
  }

  lines.push(`SUMMARY:${escapeIcs(ev.title)}`);

  if (ev.description) {
    lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`);
  }

  if (ev.location) {
    lines.push(`LOCATION:${escapeIcs(ev.location)}`);
  }

  const rrule = rruleFromRecurrence(ev.recurrence);
  if (rrule) {
    lines.push(rrule);
  }

  if (ev.attendees) {
    for (const a of ev.attendees) {
      if (a.email) {
        lines.push(`ATTENDEE;CN=${escapeIcs(a.name || "")}:mailto:${a.email}`);
      }
    }
  }

  if (ev.reminderMinutes && ev.reminderMinutes > 0) {
    lines.push("BEGIN:VALARM");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${escapeIcs(ev.title)} reminder`);
    lines.push(`TRIGGER:-PT${ev.reminderMinutes}M`);
    lines.push("END:VALARM");
  }

  lines.push(`DTSTAMP:${toIcsDate(new Date())}`);
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

export function exportToIcs(events: CalendarEvent[], filename = "calendar.ics"): void {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//HRM Calendar//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  for (const ev of events) {
    lines.push(eventToVevent(ev));
  }

  lines.push("END:VCALENDAR");

  const content = lines.join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
