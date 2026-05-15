// models/Shifts.ts
export type AppliedShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string;
  time: string;
  status?: 'Pending' | 'Confirmed' | 'Rejected';
};

export type CompletedShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string;
  time: string;
  rated: boolean;
  rating: number;
  status?: 'Completed';
};

export type AllShift = {
  id: string;
  title: string;
  company: string;
  site: string;
  rate: string;
  date: string;
  time: string;
  status?: 'Available' | 'Pending' | 'Confirmed';
};

export type ShiftCardItem = AppliedShift | CompletedShift | AllShift;
