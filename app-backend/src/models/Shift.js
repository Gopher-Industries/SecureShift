import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  date:       { type: Date,   required: true },            // shift calendar date
  startTime:  { type: Date,   required: true },            // store as Date (your file shows Date)
  endTime:    { type: Date,   required: true },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  applicants:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedGuard:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: { type: String, enum: ['open', 'applied', 'assigned', 'completed'], default: 'open', index: true },

  guardRating:     { type: Number, min: 1, max: 5 },
  employerRating:  { type: Number, min: 1, max: 5 },
  ratedByGuard:    { type: Boolean, default: false },
  ratedByEmployer: { type: Boolean, default: false },
}, { timestamps: true });


const Shift = mongoose.model('Shift', shiftSchema);
export default Shift;