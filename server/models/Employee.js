
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        department: {
            type: String,
            required: true,
            enum: ["Development", "Design", "QA", "HR", "Sales"]
        },

        role: {
            type: String,
            required: true,
            trim: true
        },

        joiningDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["Active", "Inactive", "On Leave"],
            default: "Active"
        },

        skills: {
            type: [String],
            default: []
        },

        leaveStart: {
            type: Date,
            default: null
        },

        leaveEnd: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
