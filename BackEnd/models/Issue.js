const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (images) => images.length <= 5,
        message: "A maximum of 5 evidence images is allowed",
      },
    },
    resolutionEvidence: {
      type: [String],
      default: [],
      validate: {
        validator: (images) => images.length <= 5,
        message: "A maximum of 5 resolution evidence images is allowed",
      },
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "In Progress", "Resolved", "Closed"],
      default: "Pending",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    voters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

issueSchema.virtual("votes").get(function () {
  return this.voters.length;
});

const Issue = mongoose.models.Issue || mongoose.model("Issue", issueSchema);

module.exports = Issue;
