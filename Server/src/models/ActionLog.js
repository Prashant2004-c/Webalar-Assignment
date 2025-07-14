const mongoose = require('mongoose');

const ActionLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'assign', 'move'],
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// index for faster fetch of recent actions
ActionLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ActionLog', ActionLogSchema);