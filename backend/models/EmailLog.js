import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    required: true
  },
  error: {
    type: String
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
emailLogSchema.index({ campaignId: 1, status: 1 });
emailLogSchema.index({ email: 1 });

export default mongoose.model('EmailLog', emailLogSchema);
