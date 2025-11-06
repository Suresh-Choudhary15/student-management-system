const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    semester: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
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

// Virtual for assignments
courseSchema.virtual("assignments", {
  ref: "Assignment",
  localField: "_id",
  foreignField: "course",
});

// Virtual for student count
courseSchema.virtual("studentCount").get(function () {
  return this.students ? this.students.length : 0;
});

module.exports = mongoose.model("Course", courseSchema);
