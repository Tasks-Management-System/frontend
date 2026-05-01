export type HolidayType = "national" | "company";

export interface Holiday {
  _id: string;
  orgAdmin: string | null;
  name: string;
  date: string;
  type: HolidayType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayBody {
  name: string;
  date: string;
  type: HolidayType;
}
