// env.js - checks all environment variables at startup so we get one clear
// error report instead of random crashes scattered across the codebase
import dotenv from "dotenv";

// load the .env file before anything else runs
dotenv.config();

// these variables hold sensitive values - we show the name but never the value in logs
const SECRETS = new Set([
  "JWT_SECRET",
  "SMTP_PASS",
  "NSW_API_SECRET",
  "LICENCE_ENC_KEY",
]);

// default placeholder values that are fine locally but must be changed for production
const INSECURE_DEFAULTS = {
  JWT_SECRET: "local-dev-jwt-secret-change-me",
  LICENCE_ENC_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
};

// if it's a secret, hide the value in the error message
function label(name) {
  return SECRETS.has(name) ? `${name} (value hidden)` : name;
}

// ports must be whole numbers between 1 and 65535
function isValidPort(str) {
  const n = Number(str);
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}

// only http/https URLs are accepted for the NSW API endpoints
function isValidHttpUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// goes through every variable and collects all the problems at once
// returns an array of error strings (empty array means everything is fine)
export function collectErrors(env = process.env) {
  const errors = [];
  const nodeEnv = (env.NODE_ENV ?? "development").trim().toLowerCase();
  const isProduction = nodeEnv === "production";
  const emailEnabled =
    (env.EMAIL_ENABLED ?? "false").trim().toLowerCase() === "true";
  const verificationEnabled =
    (env.VERIFICATION_ENABLED ?? "false").trim().toLowerCase() === "true";

  // helper so we don't repeat the label() call everywhere
  function err(name, message) {
    errors.push(`  ${label(name)}: ${message}`);
  }

  // MONGO_URI - the database connection string, always required
  const mongoUri = (env.MONGO_URI ?? "").trim();
  if (!mongoUri) {
    err("MONGO_URI", "required but missing");
  } else if (
    !mongoUri.startsWith("mongodb://") &&
    !mongoUri.startsWith("mongodb+srv://")
  ) {
    err("MONGO_URI", 'must start with "mongodb://" or "mongodb+srv://"');
  }

  // JWT_SECRET - used to sign auth tokens, needs to be long enough to be secure
  const jwtSecret = (env.JWT_SECRET ?? "").trim();
  const minJwtLen = isProduction ? 32 : 8; // stricter in production
  if (!jwtSecret) {
    err("JWT_SECRET", "required but missing");
  } else if (jwtSecret.length < minJwtLen) {
    err(
      "JWT_SECRET",
      `must be at least ${minJwtLen} characters in ${nodeEnv} mode`,
    );
  } else if (isProduction && jwtSecret === INSECURE_DEFAULTS.JWT_SECRET) {
    err("JWT_SECRET", "cannot use the default dev value in production");
  }

  // PORT - optional, defaults to 5000 if not set
  const portStr = (env.PORT ?? "").trim();
  if (portStr && !isValidPort(portStr)) {
    err("PORT", `must be a number between 1 and 65535, got "${portStr}"`);
  }

  // LICENCE_ENC_KEY - AES-256 encryption key, must be exactly 32 bytes when decoded
  const licenceKey = (env.LICENCE_ENC_KEY ?? "").trim();
  if (!licenceKey) {
    err("LICENCE_ENC_KEY", "required but missing");
  } else {
    const keyBuf = Buffer.from(licenceKey, "base64");
    if (keyBuf.length !== 32) {
      err(
        "LICENCE_ENC_KEY",
        `must decode to exactly 32 bytes, got ${keyBuf.length} bytes`,
      );
    }
    if (isProduction && licenceKey === INSECURE_DEFAULTS.LICENCE_ENC_KEY) {
      err("LICENCE_ENC_KEY", "cannot use the default dev value in production");
    }
  }

  // NODE_ENV - only accept known values so typos don't go unnoticed
  const allowedEnvs = ["development", "test", "staging", "production"];
  if (nodeEnv && !allowedEnvs.includes(nodeEnv)) {
    err(
      "NODE_ENV",
      `must be one of: ${allowedEnvs.join(", ")}, got "${nodeEnv}"`,
    );
  }

  // SMTP settings - only checked when email is actually enabled
  if (emailEnabled) {
    if (!(env.SMTP_HOST ?? "").trim()) {
      err("SMTP_HOST", "required when EMAIL_ENABLED=true");
    }

    const smtpPortStr = (env.SMTP_PORT ?? "1025").trim();
    if (!isValidPort(smtpPortStr)) {
      err(
        "SMTP_PORT",
        `must be a number between 1 and 65535, got "${smtpPortStr}"`,
      );
    }

    const smtpSecure = (env.SMTP_SECURE ?? "false").trim().toLowerCase();
    if (smtpSecure !== "true" && smtpSecure !== "false") {
      err("SMTP_SECURE", `must be "true" or "false", got "${smtpSecure}"`);
    }

    // SMTP_AUTH_REQUIRED controls whether SMTP credentials are needed
    const smtpAuth = (env.SMTP_AUTH_REQUIRED ?? "false").trim().toLowerCase();
    if (smtpAuth !== "true" && smtpAuth !== "false") {
      err("SMTP_AUTH_REQUIRED", `must be "true" or "false", got "${smtpAuth}"`);
    }

    // credentials only required when authentication is enabled
    if (smtpAuth === "true") {
      if (!(env.SMTP_USER ?? "").trim()) {
        err(
          "SMTP_USER",
          "required when EMAIL_ENABLED=true and SMTP_AUTH_REQUIRED=true",
        );
      }
      if (!(env.SMTP_PASS ?? "").trim()) {
        err(
          "SMTP_PASS",
          "required when EMAIL_ENABLED=true and SMTP_AUTH_REQUIRED=true",
        );
      }
    }

    if (!(env.SMTP_FROM_EMAIL ?? "").trim()) {
      err("SMTP_FROM_EMAIL", "required when EMAIL_ENABLED=true");
    }
  }

  // NSW verification credentials - only checked when verification is enabled
  if (verificationEnabled) {
    const nswTokenUrl = (env.NSW_TOKEN_URL ?? "").trim();
    if (!nswTokenUrl) {
      err("NSW_TOKEN_URL", "required when VERIFICATION_ENABLED=true");
    } else if (!isValidHttpUrl(nswTokenUrl)) {
      err(
        "NSW_TOKEN_URL",
        `must be a valid http/https URL, got "${nswTokenUrl}"`,
      );
    }

    const nswVerifyUrl = (env.NSW_VERIFY_URL ?? "").trim();
    if (!nswVerifyUrl) {
      err("NSW_VERIFY_URL", "required when VERIFICATION_ENABLED=true");
    } else if (!isValidHttpUrl(nswVerifyUrl)) {
      err(
        "NSW_VERIFY_URL",
        `must be a valid http/https URL, got "${nswVerifyUrl}"`,
      );
    }

    if (!(env.NSW_API_KEY ?? "").trim()) {
      err("NSW_API_KEY", "required when VERIFICATION_ENABLED=true");
    }
    if (!(env.NSW_API_SECRET ?? "").trim()) {
      err("NSW_API_SECRET", "required when VERIFICATION_ENABLED=true");
    }
  }

  return errors;
}

// called once in server.js - prints all problems together and exits if anything is wrong
export function validateEnv() {
  const errors = collectErrors(process.env);

  if (errors.length > 0) {
    console.error(
      "❌ Environment configuration is invalid. Fix the following before starting:\n",
    );
    errors.forEach((e) => console.error(e));
    console.error("\nSee app-backend/.env.example for the required variables.");
    process.exit(1);
  }

  const nodeEnv = (process.env.NODE_ENV ?? "development").trim();
  console.log(`✅ Environment validated (NODE_ENV=${nodeEnv})`);
}
