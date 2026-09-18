import { describe, expect, test } from "@jest/globals";
import Notification from "../src/models/Notification.js";
import { buildSeedData } from "../src/scripts/seed/data.js";
import { SEED_IDS } from "../src/scripts/seed/ids.js";

describe("seed notification fixtures", () => {
  test("use valid deterministic creators", () => {
    const data = buildSeedData(new Date("2026-07-13T12:00:00.000Z"));
    const expectedCreators = new Map([
      [
        String(SEED_IDS.notifications.application),
        String(SEED_IDS.users.employerOperations),
      ],
      [
        String(SEED_IDS.notifications.approval),
        String(SEED_IDS.users.employerOperations),
      ],
      [
        String(SEED_IDS.notifications.documentExpiry),
        String(SEED_IDS.users.admin),
      ],
    ]);
    const deterministicUserIds = new Set(
      Object.values(SEED_IDS.users).map(String),
    );
    const userFixtureIds = new Set(
      [data.users.admin, ...data.users.employers, ...data.users.guards].map(
        (user) => String(user._id),
      ),
    );

    expect(data.notifications).toHaveLength(3);

    for (const notification of data.notifications) {
      const creatorId = String(notification.createdBy);

      expect(creatorId).toBe(expectedCreators.get(String(notification._id)));
      expect(deterministicUserIds.has(creatorId)).toBe(true);
      expect(userFixtureIds.has(creatorId)).toBe(true);
      expect(new Notification(notification).validateSync()).toBeUndefined();
    }
  });
});
