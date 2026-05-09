import { describe, expect, it } from "@jest/globals";
import {
  calculateDistance,
  validateAttendanceCoordinates,
  verifyWithinSiteRadius,
  buildAttendancePayrollFacts,
} from "../../src/services/attendance.service.js";

describe("attendance.service", () => {
    describe("calculateDistance", () => {
        it("returns 0 for identical coordinates", () => {
            const location = {
                latitude: -37.8136,
                longitude: 144.9631
            };

            const distance = calculateDistance(location, location);
            expect(distance).toBe(0);
        });

        it("calculates a non-zero distance for different coordinates", () => {
            const location1 = {
                latitude: -37.8136,
                longitude: 144.9631
            };
            const location2 = {
                latitude: -37.8140,
                longitude: 144.9640
            };

            const distance = calculateDistance(location1, location2);
            expect(distance).toBeGreaterThan(0);
        });
    });

    describe("validateAttendanceCoordinates", () => {
        it("accepts valid coordinates", () => {
            const result = validateAttendanceCoordinates(-37.8136, 144.9631);

            expect(result).toEqual({
                latitude: -37.8136,
                longitude: 144.9631
            });
        });

        it("rejects missing coordinates", () => {
            expect(() => validateAttendanceCoordinates(undefined, 144.9631)).toThrow(
                "Invalid location coordinates");
        });

        it("rejects invalid latitude", () => {
            expect(() => validateAttendanceCoordinates(-100, 144.9631)).toThrow(
                "Invalid location coordinates");
        });

        it("rejects invalid longitude", () => {
            expect(() => validateAttendanceCoordinates(-37.8136, 200)).toThrow(
                "Invalid location coordinates"
            );
        });
    });

    describe("verifyWithinSiteRadius", () => {
        it("passes when guard location is within radius", () => {
            const siteLocation = {
                latitude: -37.8136,
                longitude: 144.9631
            };
            const guardLocation = {
                latitude: -37.8137,
                longitude: 144.9632
            };

            const result = verifyWithinSiteRadius({
                guardLocation,
                siteLocation,
            });
            expect(result.distanceKm).toBeGreaterThan(0);
            expect(result.distanceKm).toBeLessThan(0.1);
        });

        it("throws error when guard location is outside radius", () => {
            const siteLocation = {
                latitude: -37.8136,
                longitude: 144.9631
            };
            const guardLocation = {
                latitude: 0,
                longitude: 0,
            };

            expect(() =>
                verifyWithinSiteRadius({
                    guardLocation,
                    siteLocation,
                })
            ).toThrow("Not within shift radius (100m)");
        });
    });

    describe("buildAttendancePayrollFacts", () => {
        it("returns payroll-ready attendance facts for a shift with check-out", () => {
            const shift = {
                _id: "shift-1",
                date: new Date("2026-05-09"),
                startTime: "09:00",
                endTime: "17:00",
                payRate: 30,
            };
            const attendance = {
                guardId: "guard-1",
                checkInTime: new Date("2026-05-09T09:01:00Z"),
                checkOutTime: new Date("2026-05-09T17:02:00Z"),
                locationVerified: true,
            };

            const result = buildAttendancePayrollFacts(attendance, shift);
            expect(result).toEqual({
                shiftId: "shift-1",
                guardId: "guard-1",
                scheduledDate: shift.date,
                scheduledStartTime: "09:00",
                scheduledEndTime: "17:00",
                payRate: 30,
                checkInTime: attendance.checkInTime,
                checkOutTime: attendance.checkOutTime,
                locationVerified: true,
            });
        });
    });
});