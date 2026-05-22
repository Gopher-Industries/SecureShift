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
  attendance?: {
    checkInTime?: string;
    checkOutTime?: string;
  };
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
  attendance?: {
    checkInTime?: string;
    checkOutTime?: string;
  };
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
  attendance?: {
    checkInTime?: string;
    checkOutTime?: string;
  };
};

export type ShiftCardItem = AppliedShift | CompletedShift | AllShift;
