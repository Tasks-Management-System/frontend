export type ClientStatus = 'active' | 'inactive';

export interface Client {
  _id: string;
  orgAdmin: string | null;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  status: ClientStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStage = 'lead' | 'prospect' | 'proposal' | 'won' | 'lost';

export interface Lead {
  _id: string;
  orgAdmin: string | null;
  title: string;
  client: Client | string;
  stage: LeadStage;
  value: number;
  currency: string;
  probability: number;
  assignedTo?: { _id: string; name: string; email: string } | string | null;
  expectedCloseDate?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContactLogType = 'call' | 'email' | 'meeting' | 'note';

export interface ContactLog {
  _id: string;
  client: string | Client;
  lead?: string | Lead | null;
  type: ContactLogType;
  summary: string;
  loggedBy?: { _id: string; name: string } | string | null;
  loggedAt: string;
  createdAt: string;
}

export interface ForecastItem {
  _id: string;
  title: string;
  client: { _id: string; name: string; company?: string } | string;
  stage: LeadStage;
  value: number;
  probability: number;
  weightedValue: number;
  currency: string;
  expectedCloseDate?: string | null;
}

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  lead: 'Lead',
  prospect: 'Prospect',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

export const LEAD_STAGE_ORDER: LeadStage[] = ['lead', 'prospect', 'proposal', 'won', 'lost'];

export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  lead: 'bg-slate-100 text-slate-700',
  prospect: 'bg-sky-100 text-sky-700',
  proposal: 'bg-violet-100 text-violet-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

export const CONTACT_LOG_LABELS: Record<ContactLogType, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
};
