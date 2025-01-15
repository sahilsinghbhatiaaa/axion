const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid'); // Import UUID package
const generateShortUUID = () => uuidv4().replace(/-/g, '').slice(0, 10);

const ClassroomSchema = new Schema(
  {
    id: {
      type: String,
      default: () => `clid-${generateShortUUID()}`, // Generate unique ID with "clid-" prefix
      unique: true, // Ensure the UUID is unique
      immutable: true, // Prevent changes to this field
    },
    name: {
      type: String,
      required: true, // Classroom name is mandatory
      trim: true,
    },
    schoolId: {
      type: String,
      required: true, // School ID is mandatory
    },
    capacity: {
      type: Number,
      required: true, // Capacity is mandatory
      min: 1, // Minimum capacity is 1 student
    },
    resources: {
      type: [String], // List of resources
      default: [], // Default to an empty array
    },
    managedBy: {
      type: String,
      default: "8892ahskas", // Reference to the User model (administrator)
      required: true, // ManagedBy is mandatory
    },
    createdAt: {
      type: Date,
      default: Date.now, // Automatically set creation date
      immutable: true, // Prevent updates to this field
    },
    updatedAt: {
      type: Date,
      default: Date.now, // Automatically set update date
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
    versionKey: false, // Disable the version key (__v field)
  },
);

// Pre-save hook to update the `updatedAt` field
ClassroomSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export the model
module.exports = mongoose.model('Classroom', ClassroomSchema);
