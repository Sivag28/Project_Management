import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true  // Project-specific by default
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  color: {
    type: String,
    enum: ['yellow', 'orange', 'pink', 'purple', 'green', 'blue'],
    default: 'yellow'
  },
  positionX: {
    type: Number,
    default: 50
  },
  positionY: {
    type: Number,
    default: 50
  },
  width: {
    type: Number,
    default: 200
  },
  height: {
    type: Number,
    default: 150
  },
  zIndex: {
    type: Number,
    default: 1
  },
  rotation: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Note', noteSchema);

