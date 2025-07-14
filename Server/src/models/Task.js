const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in progress', 'done'],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastEditedAt: {
      type: Date,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// check title is unique
TaskSchema.index({title: 1 , createdBy: 1}, {unique: true});

// for smart assign logic
TaskSchema.index({ assignedTo: 1, status: 1 });

// validate title name
TaskSchema.methods.isValidTitle = function () {
  const columnNames = ['todo', 'in progress', 'done'];
  return !columnNames.includes(this.title.trim().toLowerCase());
}

// Pre-save hook to validate title
TaskSchema.pre('save', function(next) {
  if(!this.isValidTitle()) {
    const error = new Error('Task title cannot match column names (Todo, In Progress, Done)');
    return next(error);
  }
  next();
});

// Pre-save hook to update lastEditedAt
TaskSchema.pre('save', function(next) {
  if(this.isModified() && !this.isNew) {
    this.lastEditedAt = Date.now();
  }
  next();
});


module.exports = mongoose.model('Task', TaskSchema);