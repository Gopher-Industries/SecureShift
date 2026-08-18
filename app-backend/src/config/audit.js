const VALID_VALUES = ["true", "false"];

const rawValue = process.env.AUDIT_LOG_ENABLED;

let AUDIT_LOG_ENABLED;

if (rawValue === undefined) {
  AUDIT_LOG_ENABLED = true;
  console.warn(
    "⚠️ AUDIT_LOG_ENABLED is not set; audit-log persistence is enabled by default.",
  );
} else if (!VALID_VALUES.includes(rawValue)) {
  throw new Error(
    `Invalid AUDIT_LOG_ENABLED value '${rawValue}'. Expected 'true' or 'false'.`,
  );
} else {
  AUDIT_LOG_ENABLED = rawValue === "true";

  if (!AUDIT_LOG_ENABLED) {
    console.warn(
      "⚠️ Audit-log persistence is disabled (AUDIT_LOG_ENABLED=false). Audit events will not be stored.",
    );
  }
}

export default AUDIT_LOG_ENABLED;
