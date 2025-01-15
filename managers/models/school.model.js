const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid'); // Import UUID package
const generateShortUUID = () => uuidv4().replace(/-/g, '').slice(0, 10);

const SchoolSchema = new Schema(
  {
    id: {
      type: String,
      default: () => `scid-${generateShortUUID()}`, // Generate unique ID with "scid-" prefix
      unique: true, // Ensure the UUID is unique
      immutable: true, // Prevent changes to this field
    },
    name: {
      type: String,
      required: true, // School name is mandatory
      trim: true,
    },
    address: {
      type: String,
      required: true, // Address is mandatory
      trim: true,
    },
    contact: {
      phone: {
        type: String,
        required: true, // Phone number is mandatory
        trim: true,
      },
      email: {
        type: String,
        required: true, // Email is mandatory
        trim: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email validation
      },
    },
    createdBy: {
      type: String,
      default: "936425e2b1", // Default value for createdBy
      required: true,
    },
    profile: {
      establishedYear: {
        type: Number,
        required: true, // Established year is mandatory
        min: 1800, // Minimum valid year for school establishment
        max: new Date().getFullYear(), // Can't be in the future
      },
      website: {
        type: String,
        trim: true,
        match: /^https?:\/\/[^\s/$.?#].[^\s]*$/, // URL validation
      },
      additionalInfo: {
        type: String,
        trim: true,
      },
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
    versionKey: false
  },
);

// Pre-save hook to update the `updatedAt` field
SchoolSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export the model
module.exports = mongoose.model('School', SchoolSchema);
