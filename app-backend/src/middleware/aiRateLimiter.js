import rateLimit from "express-rate-limit";

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI requests. Please try again later.",
  },
});

export default aiRateLimiter;
