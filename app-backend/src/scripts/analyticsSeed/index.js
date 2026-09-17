import crypto from "crypto";
import mongoose from "mongoose";

import Employer from "../../models/Employer.js";
import Guard from "../../models/Guard.js";
import Timesheet from "../../models/Timesheet.js";
import User from "../../models/User.js";
import { assertSeedSafety } from "../seed/safety.js";

const ANALYTICS_PASSWORD = "AnalyticsDemo1!";

const deterministicId = (label) =>
  new mongoose.Types.ObjectId(
    crypto
      .createHash("sha256")
      .update(`secureshift-analytics:${label}`)
      .digest("hex")
      .slice(0, 24),
  );

const employerAId = deterministicId("employer:a");
const employerBId = deterministicId("employer:b");

const employerIds = [employerAId, employerBId];

const employerAGuardIds = Array.from({ length: 20 }, (_, index) =>
  deterministicId(`employer:a:guard:${index + 1}`),
);

const employerBGuardIds = Array.from({ length: 6 }, (_, index) =>
  deterministicId(`employer:b:guard:${index + 1}`),
);

const allGuardIds = [...employerAGuardIds, ...employerBGuardIds];

const ANALYTICS_USER_IDS = [...employerIds, ...allGuardIds];

const employerAWorkload = [
  40, 36, 32, 28,
  16, 16, 16, 16, 16, 16, 16, 16, 16, 16,
  8, 8, 8, 8, 8, 8,
];

const employerBWorkload = [10, 10, 10, 10, 10, 10];

const weekdayPattern = [
  5, 5, 6, 6,
  4, 5, 6,
  3, 4,
  2, 1, 0,
];

const referenceMonday = new Date("2026-07-20T00:00:00.000Z");

const analyticsTimesheetIds = [];

const dateForSequence = (sequence) => {
  const week = Math.floor(sequence / weekdayPattern.length) % 8;
  const weekdayOffset = weekdayPattern[sequence % weekdayPattern.length];

  const date = new Date(referenceMonday);
  date.setUTCDate(
    referenceMonday.getUTCDate() + week * 7 + weekdayOffset,
  );

  return date;
};

const hoursForSequence = (sequence, guardIndex) =>
  6 + ((sequence + guardIndex) % 5) * 0.5;

const savePersona = async (Model, data) => {
  let user = await Model.findById(data._id).select("+password");

  if (!user) {
    user = new Model({
      ...data,
      password: ANALYTICS_PASSWORD,
    });
  } else {
    user.set(data);

    if (!(await user.matchPassword(ANALYTICS_PASSWORD))) {
      user.password = ANALYTICS_PASSWORD;
    }
  }

  await user.save();
  return user;
};

const buildEmployer = ({ id, name, email, ABN }) => ({
  _id: id,
  name,
  email,
  role: "employer",
  ABN,
  phone: "0400000000",
  isDeleted: false,
});

const guardLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const buildGuard = ({ id, index, employerLabel }) => ({
  _id: id,
  name: `${employerLabel} Guard ${guardLetters[index]}`,
  email: `${employerLabel.toLowerCase()}.guard.${String(index + 1).padStart(2, "0")}@analytics.secureshift.test`,
  role: "guard",
  phone: `0410${String(index + 1).padStart(6, "0")}`,
  isDeleted: false,
});

const buildTimesheets = ({
  employerId,
  guardIds,
  workload,
  employerLabel,
}) => {
  const records = [];
  let sequence = 0;

  guardIds.forEach((guardId, guardIndex) => {
    const shiftCount = workload[guardIndex];

    for (let shiftIndex = 0; shiftIndex < shiftCount; shiftIndex += 1) {
      const id = deterministicId(
        `${employerLabel}:timesheet:${guardIndex + 1}:${shiftIndex + 1}`,
      );

      analyticsTimesheetIds.push(id);

      const shiftDate = dateForSequence(sequence);
      const actualHours = hoursForSequence(sequence, guardIndex);
      const scheduledHours = actualHours + 0.5;

      const checkInTime = new Date(shiftDate);
      checkInTime.setUTCHours(8, 0, 0, 0);

      const checkOutTime = new Date(checkInTime);
      checkOutTime.setTime(
        checkInTime.getTime() + actualHours * 60 * 60 * 1000,
      );

      records.push({
        _id: id,
        shiftId: deterministicId(
          `${employerLabel}:shift:${guardIndex + 1}:${shiftIndex + 1}`,
        ),
        guardId,
        employerId,
        attendanceId: deterministicId(
          `${employerLabel}:attendance:${guardIndex + 1}:${shiftIndex + 1}`,
        ),
        shiftDate,
        checkInTime,
        checkOutTime,
        scheduledHours,
        actualHours,
        payableHours: actualHours,
        attendanceBased: true,
        generatedAt: new Date("2026-09-17T00:00:00.000Z"),
      });

      sequence += 1;
    }
  });

  return records;
};

const seedAnalyticsData = async () => {
  await savePersona(
    Employer,
    buildEmployer({
      id: employerAId,
      name: "Analytics Operations",
      email: "analytics.operations@secureshift.test",
      ABN: "11111111111",
    }),
  );

  await savePersona(
    Employer,
    buildEmployer({
      id: employerBId,
      name: "Analytics Venue",
      email: "analytics.venue@secureshift.test",
      ABN: "22222222222",
    }),
  );

  for (let index = 0; index < employerAGuardIds.length; index += 1) {
    await savePersona(
      Guard,
      buildGuard({
        id: employerAGuardIds[index],
        index,
        employerLabel: "Alpha",
      }),
    );
  }

  for (let index = 0; index < employerBGuardIds.length; index += 1) {
    await savePersona(
      Guard,
      buildGuard({
        id: employerBGuardIds[index],
        index,
        employerLabel: "Beta",
      }),
    );
  }

  const employerATimesheets = buildTimesheets({
    employerId: employerAId,
    guardIds: employerAGuardIds,
    workload: employerAWorkload,
    employerLabel: "alpha",
  });

  const employerBTimesheets = buildTimesheets({
    employerId: employerBId,
    guardIds: employerBGuardIds,
    workload: employerBWorkload,
    employerLabel: "beta",
  });

  const timesheets = [...employerATimesheets, ...employerBTimesheets];

  await Timesheet.bulkWrite(
    timesheets.map((record) => ({
      updateOne: {
        filter: { _id: record._id },
        update: { $set: record },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return {
    dataset: "SecureShift deterministic synthetic analytics evaluation data",
    synthetic: true,
    employers: 2,
    guards: allGuardIds.length,
    timesheets: timesheets.length,
    employerA: {
      employerId: String(employerAId),
      guards: employerAGuardIds.length,
      timesheets: employerATimesheets.length,
    },
    employerB: {
      employerId: String(employerBId),
      guards: employerBGuardIds.length,
      timesheets: employerBTimesheets.length,
    },
  };
};

const resetAnalyticsData = async () => {
  const timesheets = await Timesheet.deleteMany({
    _id: { $in: analyticsTimesheetIds },
  });

  const users = await User.deleteMany({
    _id: { $in: ANALYTICS_USER_IDS },
  });

  return {
    deleted: {
      timesheets: timesheets.deletedCount,
      users: users.deletedCount,
    },
  };
};

const reset = process.argv.includes("--reset");

const main = async () => {
  const { mongoUri, target } = assertSeedSafety(process.env, { reset });

  console.log(
    `SecureShift analytics seed target: ${target.hosts.join(",")}/${target.database}`,
  );

  console.log(
    "Dataset type: SYNTHETIC / DETERMINISTIC / ANALYTICS EVALUATION ONLY",
  );

  await mongoose.connect(mongoUri);

  const result = reset
    ? await resetAnalyticsData()
    : await seedAnalyticsData();

  console.log(JSON.stringify(result, null, 2));
};

main()
  .catch((error) => {
    console.error(`Analytics seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
