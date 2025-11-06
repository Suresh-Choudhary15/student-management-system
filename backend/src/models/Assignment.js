const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    type: {
      type: String,
      enum: ["individual", "group"],
      default: "individual",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    oneDriveLink: {
      type: String,
      trim: true,
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    instructions: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        name: String,
        url: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for submissions
assignmentSchema.virtual("submissions", {
  ref: "Submission",
  localField: "_id",
  foreignField: "assignment",
});

// Virtual to check if assignment is overdue
assignmentSchema.virtual("isOverdue").get(function () {
  return this.dueDate < new Date();
});

module.exports = mongoose.model("Assignment", assignmentSchema);
