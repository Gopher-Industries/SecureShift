import Admin from "../../models/Admin.js";
import Availability from "../../models/Availability.js";
import Branch from "../../models/Branch.js";
import Employer from "../../models/Employer.js";
import Guard from "../../models/Guard.js";
import Message from "../../models/Message.js";
import Notification from "../../models/Notification.js";
import Payroll from "../../models/Payroll.js";
import Role from "../../models/Role.js";
import Shift from "../../models/Shift.js";
import ShiftAttendance from "../../models/ShiftAttendance.js";
import User from "../../models/User.js";
import { syncPayrollForShiftIds } from "../../services/payroll.service.js";
import { buildSeedData, SEED_PASSWORD } from "./data.js";
import { idsFor, SEED_IDS } from "./ids.js";

const saveDocument = async (Model, data) => {
  const existing = await Model.findById(data._id);
  const document = existing || new Model({ _id: data._id });
  document.set(data);
  await document.save();
  return document;
};

const assertUniqueValueIsOwned = async (Model, query, id, label) => {
  const existing = await Model.findOne(query).select("_id").lean();
  if (existing && String(existing._id) !== String(id)) {
    throw new Error(
      `${label} already exists with a non-seed ObjectId; reset that conflict manually`,
    );
  }
};

const savePersona = async (Model, data) => {
  await assertUniqueValueIsOwned(
    User,
    { email: data.email },
    data._id,
    `User ${data.email}`,
  );

  let user = await Model.findById(data._id).select("+password");
  if (!user) {
    user = new Model({ ...data, password: SEED_PASSWORD });
  } else {
    user.set(data);
    if (!(await user.matchPassword(SEED_PASSWORD))) {
      user.password = SEED_PASSWORD;
    }
  }

  await user.save();
  return user;
};

const ensurePayrollSlotIsOwned = async (payroll) => {
  const existing = await Payroll.findOne({
    guardId: payroll.guardId,
    employerId: payroll.employerId,
    periodType: payroll.periodType,
    periodStart: payroll.periodStart,
    periodEnd: payroll.periodEnd,
  })
    .select("_id")
    .lean();

  if (existing && String(existing._id) !== String(payroll._id)) {
    throw new Error(
      "Seed payroll period already exists with a non-seed ObjectId",
    );
  }
};

export const getSeedCounts = async () => ({
  roles: await Role.countDocuments({ _id: { $in: idsFor("roles") } }),
  users: await User.countDocuments({ _id: { $in: idsFor("users") } }),
  branches: await Branch.countDocuments({ _id: { $in: idsFor("branches") } }),
  availability: await Availability.countDocuments({
    _id: { $in: idsFor("availability") },
  }),
  shifts: await Shift.countDocuments({ _id: { $in: idsFor("shifts") } }),
  attendance: await ShiftAttendance.countDocuments({
    _id: { $in: idsFor("attendance") },
  }),
  payroll: await Payroll.countDocuments({ _id: { $in: idsFor("payroll") } }),
  messages: await Message.countDocuments({ _id: { $in: idsFor("messages") } }),
  notifications: await Notification.countDocuments({
    _id: { $in: idsFor("notifications") },
  }),
});

export const seedLocalData = async ({ now = new Date() } = {}) => {
  const data = buildSeedData(now);

  for (const role of data.roles) {
    await assertUniqueValueIsOwned(
      Role,
      { name: role.name },
      role._id,
      `Role ${role.name}`,
    );
    await saveDocument(Role, role);
  }

  const admin = await savePersona(Admin, data.users.admin);
  for (const employer of data.users.employers) {
    await savePersona(Employer, employer);
  }
  for (const guard of data.users.guards) {
    await savePersona(Guard, guard);
  }

  for (const branch of data.branches) {
    await assertUniqueValueIsOwned(
      Branch,
      { code: branch.code },
      branch._id,
      `Branch ${branch.code}`,
    );
    await saveDocument(Branch, branch);
  }

  for (const availability of data.availability) {
    await assertUniqueValueIsOwned(
      Availability,
      { user: availability.user },
      availability._id,
      `Availability for ${availability.user}`,
    );
    await saveDocument(Availability, availability);
  }

  for (const shift of data.shifts) await saveDocument(Shift, shift);
  await saveDocument(ShiftAttendance, data.attendance);

  await ensurePayrollSlotIsOwned(data.payroll);
  await saveDocument(Payroll, data.payroll);
  await syncPayrollForShiftIds({
    shiftIds: [SEED_IDS.shifts.completed],
    periodType: data.payroll.periodType,
  });

  for (const message of data.messages) await saveDocument(Message, message);
  for (const notification of data.notifications)
    await saveDocument(Notification, notification);

  return {
    counts: await getSeedCounts(),
    adminId: String(admin._id),
  };
};

export const resetLocalData = async () => {
  const deleted = {};

  deleted.notifications = (
    await Notification.deleteMany({ _id: { $in: idsFor("notifications") } })
  ).deletedCount;
  deleted.messages = (
    await Message.deleteMany({ _id: { $in: idsFor("messages") } })
  ).deletedCount;
  deleted.payroll = (
    await Payroll.deleteMany({ _id: { $in: idsFor("payroll") } })
  ).deletedCount;
  deleted.attendance = (
    await ShiftAttendance.deleteMany({ _id: { $in: idsFor("attendance") } })
  ).deletedCount;
  deleted.shifts = (
    await Shift.deleteMany({ _id: { $in: idsFor("shifts") } })
  ).deletedCount;
  deleted.availability = (
    await Availability.deleteMany({ _id: { $in: idsFor("availability") } })
  ).deletedCount;
  deleted.branches = (
    await Branch.deleteMany({ _id: { $in: idsFor("branches") } })
  ).deletedCount;
  deleted.users = (
    await User.deleteMany({ _id: { $in: idsFor("users") } })
  ).deletedCount;
  deleted.roles = (
    await Role.deleteMany({ _id: { $in: idsFor("roles") } })
  ).deletedCount;

  return {
    deleted,
    remaining: await getSeedCounts(),
  };
};

export { SEED_IDS };
