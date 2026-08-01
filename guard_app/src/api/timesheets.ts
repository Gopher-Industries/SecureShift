import http from '../lib/http';

export type Timesheet = {
  id: string;
  shiftId: string;
  guardId: string;
  employerId: string;
  attendanceId: string;
  shiftDate: string;
  checkInTime: string;
  checkOutTime: string;
  scheduledHours: number;
  actualHours: number;
  payableHours: number;
  attendanceBased: boolean;
  generatedAt: string;
};

export type TimesheetListParams = {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type TimesheetListResponse = {
  page: number;
  limit: number;
  total: number;
  timesheets: Timesheet[];
};

// backend reads the guard from the token, so no user id is needed here
export async function getMyTimesheets(params?: TimesheetListParams) {
  const { data } = await http.get<TimesheetListResponse>('/timesheets', { params });
  return data;
}

const PAGE_LIMIT = 50;
const MAX_PAGES = 40;

// the list endpoint is paginated, so pull every page before we add up the hours
export async function getAllMyTimesheets(params?: Omit<TimesheetListParams, 'page' | 'limit'>) {
  const all: Timesheet[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const data = await getMyTimesheets({ ...params, page, limit: PAGE_LIMIT });
    const rows = data.timesheets ?? [];
    all.push(...rows);

    if (rows.length === 0 || all.length >= (data.total ?? all.length)) break;
    page += 1;
  }

  return all;
}

export async function getTimesheetById(timesheetId: string) {
  const { data } = await http.get<Timesheet>(`/timesheets/${timesheetId}`);
  return data;
}
