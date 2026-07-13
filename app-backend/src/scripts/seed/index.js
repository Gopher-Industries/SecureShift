import mongoose from "mongoose";
import { resetLocalData, seedLocalData } from "./seed.js";
import { assertSeedSafety } from "./safety.js";

const reset = process.argv.includes("--reset");

const main = async () => {
  const { mongoUri, target } = assertSeedSafety(process.env, { reset });
  console.log(
    `SecureShift local seed target: ${target.hosts.join(",")}/${target.database}`,
  );

  await mongoose.connect(mongoUri);

  const result = reset ? await resetLocalData() : await seedLocalData();
  console.log(JSON.stringify(result, null, 2));
};

main()
  .catch((error) => {
    console.error(`Local seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
