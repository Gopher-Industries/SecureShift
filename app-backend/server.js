// server.js
// env.js calls dotenv.config() as a module-level side effect and must be the
// first import so that process.env is populated before any other module reads it.
import { validateEnv } from "./src/config/env.js";

validateEnv(); // exits immediately with a clear report if config is invalid

// Dynamic imports ensure these modules (some of which read process.env at
// evaluation time, e.g. crypto.js) are only loaded after validation passes.
const { default: connectDB } = await import("./src/config/connectDB.js");
const { default: app } = await import("./src/app.js");

const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`?? Server running on http://localhost:${PORT}`);
      console.log(`?? Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("? Failed to start server:", err.message);
    process.exit(1);
  }
};

await startServer();
