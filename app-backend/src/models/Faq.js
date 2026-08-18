import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      maxlength: [500, "Question cannot exceed 500 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      maxlength: [5000, "Answer cannot exceed 5000 characters"],
    },
    category: {
      type: String,
      trim: true,
      default: "general",
      enum: [
        "general",
        "account",
        "shift",
        "payroll",
        "verification",
        "support",
      ],
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for efficient sorting and filtering
faqSchema.index({ isActive: 1, displayOrder: 1, createdAt: 1 });

const Faq = mongoose.model("Faq", faqSchema);

export default Faq;
