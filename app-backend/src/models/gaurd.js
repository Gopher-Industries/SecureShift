const mongoose = require("mongoose");

const guardSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  licence_number: { type: String, required: true },
  licence_expiry: { type: Date, required: true },
  is_verified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  number_of_reviews: { type: Number, default: 0 }
});

module.exports = mongoose.model("Guard", guardSchema);
