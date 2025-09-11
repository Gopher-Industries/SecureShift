import http from "../lib/http";
import { formatISO } from "date-fns";

// Get current user profile (guard info, including rating)
export async function getMe() {
  const { data } = await http.get("/users/me");
  return data;
}

// Get all my shifts (assigned/applied/past)
export async function getMyShifts() {
  const { data } = await http.get("/shifts/myshifts");
  return data;
}

// Get today's assigned shifts only
export async function getTodayShifts() {
  const today = new Date();
  const iso = formatISO(today, { representation: "date" });
  const { data } = await http.get("/shifts/myshifts", { params: { date: iso } });
  return data;
}

// Get upcoming assigned shifts (after today)
export async function getUpcomingShifts() {
  const { data } = await http.get("/shifts/myshifts");
  return data.filter((s: any) => new Date(s.date) > new Date());
}