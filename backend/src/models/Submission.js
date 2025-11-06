const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    status: {
      type: String,
      enum: ["pending", "acknowledged", "submitted", "graded"],
      default: "pending",
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acknowledgedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
    submissionLink: {
      type: String,
      trim: true,
    },
    marks: {
      type: Number,
      min: 0,
    },
    feedback: {
      type: String,
      trim: true,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    gradedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for uniqueness
submissionSchema.index(
  { assignment: 1, student: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { student: { $exists: true } },
  }
);

submissionSchema.index(
  { assignment: 1, group: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { group: { $exists: true } },
  }
);

module.exports = mongoose.model("Submission", submissionSchema);
