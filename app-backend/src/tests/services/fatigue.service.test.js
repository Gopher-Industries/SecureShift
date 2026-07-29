/* global describe, it, expect */

import {
  assessFatigueFromMetrics,
  buildFatigueWarnings,
  calculateFatigueScore,
  calculateShiftHours,
} from "../../services/fatigue.service.js";

describe("fatigue.service", () => {
  describe("calculateShiftHours", () => {
    it("calculates same-day shift duration", () => {
      expect(calculateShiftHours("08:00", "16:00")).toBe(8);
    });

    it("calculates overnight shift duration", () => {
      expect(calculateShiftHours("22:00", "06:00")).toBe(8);
    });

    it("throws when time format is invalid", () => {
      expect(() => calculateShiftHours("8am", "16:00")).toThrow(
        "Time must be in HH:MM format",
      );
    });
  });

  describe("calculateFatigueScore", () => {
    it("calculates a low fatigue score for a light workload", () => {
      const score = calculateFatigueScore({
        shiftsThisWeek: 2,
        hoursThisDay: 4,
        hoursThisWeek: 12,
      });

      expect(score).toBeLessThan(50);
    });

    it("returns 100 when all fatigue limits are reached", () => {
      const score = calculateFatigueScore({
        shiftsThisWeek: 5,
        hoursThisDay: 10,
        hoursThisWeek: 40,
      });

      expect(score).toBe(100);
    });

    it("caps load contribution at 100 percent", () => {
      const score = calculateFatigueScore({
        shiftsThisWeek: 10,
        hoursThisDay: 20,
        hoursThisWeek: 80,
      });

      expect(score).toBe(100);
    });
  });

  describe("buildFatigueWarnings", () => {
    it("returns no warnings when workload is within limits", () => {
      const warnings = buildFatigueWarnings({
        shiftsThisWeek: 5,
        hoursThisDay: 10,
        hoursThisWeek: 40,
      });

      expect(warnings).toEqual([]);
    });

    it("warns when weekly shift limit is exceeded", () => {
      const warnings = buildFatigueWarnings({
        shiftsThisWeek: 6,
        hoursThisDay: 8,
        hoursThisWeek: 32,
      });

      expect(warnings).toContain(
        "Guard exceeds recommended weekly shift limit of 5 shifts",
      );
    });

    it("warns when daily hour limit is exceeded", () => {
      const warnings = buildFatigueWarnings({
        shiftsThisWeek: 4,
        hoursThisDay: 12,
        hoursThisWeek: 32,
      });

      expect(warnings).toContain(
        "Guard exceeds recommended daily hour limit of 10 hours",
      );
    });

    it("warns when weekly hour limit is exceeded", () => {
      const warnings = buildFatigueWarnings({
        shiftsThisWeek: 4,
        hoursThisDay: 8,
        hoursThisWeek: 44,
      });

      expect(warnings).toContain(
        "Guard exceeds recommended weekly hour limit of 40 hours",
      );
    });
  });

  describe("assessFatigueFromMetrics", () => {
    it("returns a non-fatigued assessment when no limits are exceeded", () => {
      const assessment = assessFatigueFromMetrics({
        shiftsThisWeek: 3,
        hoursThisDay: 8,
        hoursThisWeek: 24,
      });

      expect(assessment.isFatigued).toBe(false);
      expect(assessment.warnings).toEqual([]);
      expect(assessment.fatigueScore).toBeLessThan(100);
    });

    it("returns a fatigued assessment when limits are exceeded", () => {
      const assessment = assessFatigueFromMetrics({
        shiftsThisWeek: 6,
        hoursThisDay: 12,
        hoursThisWeek: 48,
      });

      expect(assessment.isFatigued).toBe(true);
      expect(assessment.warnings).toHaveLength(3);
      expect(assessment.fatigueScore).toBe(100);
      expect(assessment.metrics).toEqual({
        shiftsThisWeek: 6,
        hoursThisDay: 12,
        hoursThisWeek: 48,
      });
    });
  });
});
