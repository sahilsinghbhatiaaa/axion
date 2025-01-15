const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Function to generate unique student IDs
const generateShortUUID = () => uuidv4().replace(/-/g, '').slice(0, 10);

const studentSchema = new Schema({
  id: {
    type: String,
    default: () => `stid-${generateShortUUID()}`,
    unique: true,  // Ensure the ID is unique
    immutable: true,  // Prevent changes to this field
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  schoolId: {
    type: String,
    required: true,
  },
  classroomId: {
    type: String,
    required: true,
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  transferHistory: [
    {
      fromClassroomId: {
        type: String,
        required: true,
      },
      toClassroomId: {
        type: String,
        required: true,
      },
      transferDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  profile: {
    address: {
      type: String,
      required: true,
    },
    parentContact: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,  // Automatically adds createdAt and updatedAt fields
  versionKey: false,  // Disables version key (__v)
});

// Pre-save hook to update the updatedAt field
studentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);
