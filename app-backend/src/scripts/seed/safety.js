const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "mongo",
  "mongodb",
  "host.docker.internal",
]);

const SAFE_DATABASE_NAMES = new Set([
  "secureshift_local",
  "secureshift_dev",
  "secureshift_test",
]);

const parseMongoTarget = (mongoUri) => {
  if (!mongoUri.startsWith("mongodb://")) {
    throw new Error(
      "Seed requires a local mongodb:// URI; mongodb+srv:// targets are refused",
    );
  }

  const withoutScheme = mongoUri.slice("mongodb://".length).split("?")[0];
  const authorityAndPath = withoutScheme.slice(
    withoutScheme.lastIndexOf("@") + 1,
  );
  const slashIndex = authorityAndPath.indexOf("/");

  if (slashIndex === -1) {
    throw new Error("MONGO_URI must include an explicit database name");
  }

  const authority = authorityAndPath.slice(0, slashIndex);
  const database = decodeURIComponent(authorityAndPath.slice(slashIndex + 1));
  const hosts = authority.split(",").map((entry) => {
    const bracketedIpv6 = entry.match(/^\[([^\]]+)](?::\d+)?$/);
    if (bracketedIpv6) return bracketedIpv6[1].toLowerCase();
    return entry.replace(/:\d+$/, "").toLowerCase();
  });

  if (!hosts.length || hosts.some((host) => !LOCAL_HOSTS.has(host))) {
    throw new Error(
      "Seed target host is not in the local development allowlist",
    );
  }

  if (!SAFE_DATABASE_NAMES.has(database)) {
    throw new Error(
      "Seed database must be exactly secureshift_local, secureshift_dev, or secureshift_test",
    );
  }

  return { hosts, database };
};

export const assertSeedSafety = (env = process.env, { reset = false } = {}) => {
  if (
    String(env.NODE_ENV || "")
      .trim()
      .toLowerCase() === "production"
  ) {
    throw new Error("Seed is disabled when NODE_ENV=production");
  }

  if (env.SEED_ALLOW_LOCAL !== "true") {
    throw new Error("Seed requires SEED_ALLOW_LOCAL=true");
  }

  const mongoUri = String(env.MONGO_URI || "").trim();
  if (!mongoUri) {
    throw new Error("Seed requires an explicit MONGO_URI");
  }

  if (reset && env.SEED_RESET_CONFIRM !== "SecureShiftLocalReset") {
    throw new Error("Reset requires SEED_RESET_CONFIRM=SecureShiftLocalReset");
  }

  return {
    mongoUri,
    target: parseMongoTarget(mongoUri),
  };
};

export { parseMongoTarget };
