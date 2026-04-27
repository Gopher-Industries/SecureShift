import mongoose from 'mongoose';

const incidentReportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [5000, 'Description cannot exceed 5000 characters']
        },
        guardId: {type: mongoose.Schema.Types.ObjectId, ref: "Guard", required: true},
        shiftId: {type: mongoose.Schema.Types.ObjectId, ref: "Shift", required: true},
        location: {type: String, trim: true},
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },
        employerComment: {
            type: String,
            trim: true,
            maxlength: [5000, 'Comment cannot exceed 5000 characters']
        },
        status: {
            type: String,
            enum: ['resolved', 'pending'],
            default: 'pending'
        },
        attachments: [
            {
                fileName: {type: String, required: true},
                fileData: {type: Buffer, required: true}, // Store file as binary in MongoDB
                fileType: {type: String},
                fileSize: {type: Number},
                uploadedAt: {type: Date, default: Date.now},
                uploadedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
            }
        ],
        resolvedAt: {type: Date},
        resolvedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
    }, {timestamps: true} // Auto create createdAt updatedAt fields in db
)

const IncidentReport = mongoose.model('IncidentReport', incidentReportSchema);
export default IncidentReport;