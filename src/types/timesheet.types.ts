export interface TimesheetUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface TimesheetProject {
  _id: string;
  projectName: string;
}

export interface TimesheetTask {
  _id: string;
  taskName: string;
}

export interface TimesheetEntry {
  _id: string;
  user: TimesheetUser;
  task?: TimesheetTask | null;
  project: TimesheetProject;
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  weekNumber: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetSummary {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
}

export interface TimesheetsListResponse {
  success: boolean;
  entries: TimesheetEntry[];
  summary: TimesheetSummary;
}
