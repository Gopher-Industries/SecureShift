import { SEED_IDS } from "./ids.js";

export const SEED_PASSWORD = "SecureShift1!";

const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const atLocalTime = (date, hours, minutes = 0) => {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

const weekBounds = (date) => {
  const start = new Date(date);
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - day + (day === 0 ? -6 : 1));
  start.setUTCHours(0, 0, 0, 0);

  const end = addDays(start, 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

export const buildSeedData = (now = new Date()) => {
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const completedDate = today;
  const payrollPeriod = weekBounds(completedDate);
  const adminId = SEED_IDS.users.admin;

  return {
    roles: [
      {
        _id: SEED_IDS.roles.superAdmin,
        name: "super_admin",
        description: "System-wide super administrator",
        permissions: ["*"],
        isSystem: true,
      },
      {
        _id: SEED_IDS.roles.admin,
        name: "admin",
        description: "System admin with broad permissions",
        permissions: [
          "user:read",
          "user:write",
          "shift:read",
          "shift:write",
          "shift:assign",
        ],
        isSystem: true,
      },
      {
        _id: SEED_IDS.roles.branchAdmin,
        name: "branch_admin",
        description: "Branch-level administrator",
        permissions: [
          "user:read",
          "shift:read",
          "shift:write",
          "shift:assign",
          "branch:read",
        ],
        isSystem: true,
      },
      {
        _id: SEED_IDS.roles.employer,
        name: "employer",
        description: "Employer role",
        permissions: [
          "shift:read",
          "shift:write",
          "payment:read",
          "payment:write",
        ],
        isSystem: true,
      },
      {
        _id: SEED_IDS.roles.guard,
        name: "guard",
        description: "Guard role",
        permissions: ["shift:read", "shift:accept", "shift:checkin"],
        isSystem: true,
      },
      {
        _id: SEED_IDS.roles.client,
        name: "client",
        description: "Client role",
        permissions: ["shift:read", "payment:write"],
        isSystem: true,
      },
    ],
    users: {
      admin: {
        _id: adminId,
        name: "Ava Patel",
        email: "admin.local@secureshift.test",
        phone: "+61410000001",
        address: { suburb: "Adelaide", state: "SA", postcode: "5000" },
      },
      employers: [
        {
          _id: SEED_IDS.users.employerOperations,
          name: "Olivia Chen",
          email: "ops.local@secureshift.test",
          phone: "+61410000002",
          ABN: "51824753556",
          address: { suburb: "Adelaide", state: "SA", postcode: "5000" },
          favourites: [SEED_IDS.users.guardApproved],
        },
        {
          _id: SEED_IDS.users.employerVenue,
          name: "Marcus Reed",
          email: "venue.local@secureshift.test",
          phone: "+61410000003",
          ABN: "83123456789",
          address: { suburb: "North Adelaide", state: "SA", postcode: "5006" },
        },
      ],
      guards: [
        {
          _id: SEED_IDS.users.guardApproved,
          name: "Mia Thompson",
          email: "mia.guard@secureshift.test",
          phone: "+61410000011",
          address: { suburb: "Norwood", state: "SA", postcode: "5067" },
          license: {
            imageUrl: "/seed/documents/mia-licence.jpg",
            status: "verified",
            reviewedAt: addDays(today, -10),
            verifiedBy: adminId,
            expiryDate: addDays(today, 180),
          },
          documents: [
            {
              _id: SEED_IDS.documents.approvedLicence,
              type: "license",
              imageUrl: "/seed/documents/mia-licence.jpg",
              verificationStatus: "verified",
              expiryStatus: "valid",
              expiryDate: addDays(today, 180),
              reviewedAt: addDays(today, -10),
              verifiedBy: adminId,
            },
            {
              _id: SEED_IDS.documents.approvedFirstAid,
              type: "firstAid",
              imageUrl: "/seed/documents/mia-first-aid.jpg",
              verificationStatus: "verified",
              expiryStatus: "valid",
              expiryDate: addDays(today, 120),
              reviewedAt: addDays(today, -10),
              verifiedBy: adminId,
            },
          ],
          rating: 4.8,
          numberOfReviews: 18,
        },
        {
          _id: SEED_IDS.users.guardPending,
          name: "Noah Williams",
          email: "noah.guard@secureshift.test",
          phone: "+61410000012",
          address: { suburb: "Unley", state: "SA", postcode: "5061" },
          license: {
            imageUrl: "/seed/documents/noah-licence.jpg",
            status: "pending",
            expiryDate: addDays(today, 240),
          },
          documents: [
            {
              _id: SEED_IDS.documents.pendingLicence,
              type: "license",
              imageUrl: "/seed/documents/noah-licence.jpg",
              verificationStatus: "pending",
              expiryStatus: "valid",
              expiryDate: addDays(today, 240),
            },
          ],
          rating: 4.2,
          numberOfReviews: 5,
        },
        {
          _id: SEED_IDS.users.guardRejected,
          name: "Isha Singh",
          email: "isha.guard@secureshift.test",
          phone: "+61410000013",
          address: { suburb: "Prospect", state: "SA", postcode: "5082" },
          license: {
            imageUrl: "/seed/documents/isha-licence.jpg",
            status: "rejected",
            reviewedAt: addDays(today, -3),
            verifiedBy: adminId,
            rejectionReason:
              "Local seed scenario: licence image is unreadable.",
            expiryDate: addDays(today, 90),
          },
          documents: [
            {
              _id: SEED_IDS.documents.rejectedLicence,
              type: "license",
              imageUrl: "/seed/documents/isha-licence.jpg",
              verificationStatus: "rejected",
              expiryStatus: "valid",
              expiryDate: addDays(today, 90),
              reviewedAt: addDays(today, -3),
              verifiedBy: adminId,
              rejectionReason:
                "Local seed scenario: licence image is unreadable.",
            },
          ],
        },
        {
          _id: SEED_IDS.users.guardExpired,
          name: "Liam Carter",
          email: "liam.guard@secureshift.test",
          phone: "+61410000014",
          address: { suburb: "Glenelg", state: "SA", postcode: "5045" },
          license: {
            imageUrl: "/seed/documents/liam-licence.jpg",
            status: "verified",
            reviewedAt: addDays(today, -200),
            verifiedBy: adminId,
            expiryDate: addDays(today, -1),
          },
          documents: [
            {
              _id: SEED_IDS.documents.expiredLicence,
              type: "license",
              imageUrl: "/seed/documents/liam-licence.jpg",
              verificationStatus: "verified",
              expiryStatus: "expired",
              expiryDate: addDays(today, -1),
              reviewedAt: addDays(today, -200),
              verifiedBy: adminId,
            },
          ],
          rating: 3.9,
          numberOfReviews: 7,
        },
      ],
    },
    branches: [
      {
        _id: SEED_IDS.branches.operations,
        name: "Adelaide Operations Centre",
        code: "SEED-OPS-ADL",
        employerId: SEED_IDS.users.employerOperations,
        createdBy: SEED_IDS.users.employerOperations,
        location: {
          line1: "100 King William Street",
          city: "Adelaide",
          state: "SA",
          postcode: "5000",
          country: "Australia",
        },
        isActive: true,
      },
      {
        _id: SEED_IDS.branches.venue,
        name: "North Adelaide Venue",
        code: "SEED-VENUE-NTH",
        employerId: SEED_IDS.users.employerVenue,
        createdBy: SEED_IDS.users.employerVenue,
        location: {
          line1: "20 O Connell Street",
          city: "North Adelaide",
          state: "SA",
          postcode: "5006",
          country: "Australia",
        },
        isActive: true,
      },
    ],
    availability: [
      {
        _id: SEED_IDS.availability.approved,
        user: SEED_IDS.users.guardApproved,
        days: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        timeSlots: ["06:00-14:00", "14:00-22:00"],
        status: "AVAILABLE",
      },
      {
        _id: SEED_IDS.availability.pending,
        user: SEED_IDS.users.guardPending,
        days: ["Monday", "Wednesday", "Friday", "Sunday"],
        timeSlots: ["08:00-18:00"],
        status: "AVAILABLE",
      },
      {
        _id: SEED_IDS.availability.rejected,
        user: SEED_IDS.users.guardRejected,
        days: ["Tuesday", "Thursday"],
        timeSlots: ["09:00-17:00"],
        status: "OFF_DUTY",
      },
      {
        _id: SEED_IDS.availability.expired,
        user: SEED_IDS.users.guardExpired,
        days: ["Friday", "Saturday", "Sunday"],
        timeSlots: ["18:00-23:00"],
        status: "BUSY",
      },
    ],
    shifts: [
      {
        _id: SEED_IDS.shifts.open,
        title: "Office Lobby Security",
        date: addDays(today, 3),
        startTime: "08:00",
        endTime: "16:00",
        shiftType: "Day",
        breakTime: 30,
        siteId: SEED_IDS.branches.operations,
        location: {
          street: "100 King William Street",
          suburb: "Adelaide",
          state: "SA",
          postcode: "5000",
          latitude: -34.9285,
          longitude: 138.6007,
        },
        field: "Corporate",
        description: "Front desk and visitor access coverage.",
        urgency: "normal",
        payRate: 34,
        status: "open",
        createdBy: SEED_IDS.users.employerOperations,
      },
      {
        _id: SEED_IDS.shifts.applied,
        title: "Warehouse Gate Security",
        date: addDays(today, 2),
        startTime: "14:00",
        endTime: "22:00",
        shiftType: "Day",
        breakTime: 30,
        siteId: SEED_IDS.branches.operations,
        location: {
          street: "100 King William Street",
          suburb: "Adelaide",
          state: "SA",
          postcode: "5000",
          latitude: -34.9285,
          longitude: 138.6007,
        },
        field: "Logistics",
        description: "Vehicle entry and dispatch gate coverage.",
        urgency: "priority",
        payRate: 36,
        status: "applied",
        applicants: [SEED_IDS.users.guardPending, SEED_IDS.users.guardApproved],
        createdBy: SEED_IDS.users.employerOperations,
      },
      {
        _id: SEED_IDS.shifts.assigned,
        title: "Evening Event Security",
        date: addDays(today, 1),
        startTime: "16:00",
        endTime: "23:00",
        shiftType: "Night",
        breakTime: 30,
        siteId: SEED_IDS.branches.operations,
        location: {
          street: "100 King William Street",
          suburb: "Adelaide",
          state: "SA",
          postcode: "5000",
          latitude: -34.9285,
          longitude: 138.6007,
        },
        field: "Events",
        description: "Guest entry and event floor patrols.",
        urgency: "last-minute",
        payRate: 40,
        status: "assigned",
        guardIds: [SEED_IDS.users.guardApproved],
        acceptedBy: SEED_IDS.users.guardApproved,
        createdBy: SEED_IDS.users.employerOperations,
      },
      {
        _id: SEED_IDS.shifts.completed,
        title: "Completed Corporate Patrol",
        date: completedDate,
        startTime: "06:00",
        endTime: "14:00",
        shiftType: "Day",
        breakTime: 30,
        siteId: SEED_IDS.branches.operations,
        location: {
          street: "100 King William Street",
          suburb: "Adelaide",
          state: "SA",
          postcode: "5000",
          latitude: -34.9285,
          longitude: 138.6007,
        },
        field: "Corporate",
        description:
          "Completed patrol used for attendance and payroll screens.",
        payRate: 38,
        status: "completed",
        guardIds: [SEED_IDS.users.guardApproved],
        acceptedBy: SEED_IDS.users.guardApproved,
        guardRating: 5,
        ratedByEmployer: true,
        createdBy: SEED_IDS.users.employerOperations,
      },
      {
        _id: SEED_IDS.shifts.venueOpen,
        title: "Venue Entry Security",
        date: addDays(today, 4),
        startTime: "18:00",
        endTime: "23:30",
        shiftType: "Night",
        breakTime: 20,
        siteId: SEED_IDS.branches.venue,
        location: {
          street: "20 O Connell Street",
          suburb: "North Adelaide",
          state: "SA",
          postcode: "5006",
          latitude: -34.906,
          longitude: 138.596,
        },
        field: "Hospitality",
        description: "Entry queue and venue floor security.",
        urgency: "normal",
        payRate: 42,
        status: "open",
        createdBy: SEED_IDS.users.employerVenue,
      },
    ],
    attendance: {
      _id: SEED_IDS.attendance.completed,
      guardId: SEED_IDS.users.guardApproved,
      shiftId: SEED_IDS.shifts.completed,
      siteLocation: { type: "Point", coordinates: [138.6007, -34.9285] },
      checkInTime: atLocalTime(completedDate, 6),
      checkOutTime: atLocalTime(completedDate, 14),
      checkInLocation: { type: "Point", coordinates: [138.6007, -34.9285] },
      checkOutLocation: { type: "Point", coordinates: [138.6007, -34.9285] },
      locationVerified: true,
    },
    payroll: {
      _id: SEED_IDS.payroll.completedWeekly,
      guardId: SEED_IDS.users.guardApproved,
      employerId: SEED_IDS.users.employerOperations,
      periodType: "weekly",
      periodStart: payrollPeriod.start,
      periodEnd: payrollPeriod.end,
      entries: [],
      status: "PENDING",
    },
    messages: [
      {
        _id: SEED_IDS.messages.employerToGuard,
        sender: SEED_IDS.users.employerOperations,
        receiver: SEED_IDS.users.guardApproved,
        content: "Thanks Mia. Site access details are in the assigned shift.",
        timestamp: addDays(today, -1),
        isRead: true,
      },
      {
        _id: SEED_IDS.messages.guardToEmployer,
        sender: SEED_IDS.users.guardApproved,
        receiver: SEED_IDS.users.employerOperations,
        content: "Received, thank you. I will arrive ten minutes early.",
        timestamp: addDays(today, -1),
        isRead: false,
      },
    ],
    notifications: [
      {
        _id: SEED_IDS.notifications.application,
        userId: SEED_IDS.users.employerOperations,
        type: "SHIFT_APPLIED",
        title: "New shift application",
        message: "Noah Williams applied for Warehouse Gate Security.",
        data: {
          shiftId: SEED_IDS.shifts.applied,
          guardId: SEED_IDS.users.guardPending,
        },
        isRead: false,
      },
      {
        _id: SEED_IDS.notifications.approval,
        userId: SEED_IDS.users.guardApproved,
        type: "SHIFT_APPROVED",
        title: "Shift approved",
        message: "You were assigned to Evening Event Security.",
        data: { shiftId: SEED_IDS.shifts.assigned },
        isRead: false,
      },
      {
        _id: SEED_IDS.notifications.documentExpiry,
        userId: SEED_IDS.users.guardExpired,
        type: "DOCUMENT_EXPIRING",
        title: "Licence expired",
        message: "Your seeded security licence has expired.",
        data: { documentId: SEED_IDS.documents.expiredLicence },
        isRead: false,
      },
    ],
  };
};
