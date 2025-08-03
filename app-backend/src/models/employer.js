const mongoose = require("mongoose");

const employerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  abn: { type: String, required: true }
});

module.exports = mongoose.model("Employer", employerSchema);