
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        // Unique task ID
        taskId: {
            type: String,
            unique: true,
            required: true,
            default: () =>
                `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        },

        // Task details
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true
        },

        description: {
            type: String,
            required: [true, "Task description is required"],
            trim: true
        },

        // Employee assigned to this task
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: [true, "Assigned employee is required"]
        },

        // Employee details preserved for historical tasks
        assignedEmployeeSnapshot: {
            employeeId: { type: String },
            fullName: { type: String },
            email: { type: String },
            department: { type: String }
        },

        // Task department
        department: {
            type: String,
            enum: ["Development", "Design", "QA", "HR", "Sales"],
            required: [true, "Department is required"]
        },

        // Task priority
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium"
        },

        // Task status
        status: {
            type: String,
            enum: ["Todo", "In Progress", "Completed", "Cancelled"],
            default: "Todo"
        },

        // Task dates
        startDate: {
            type: Date,
            required: [true, "Start date is required"]
        },

        dueDate: {
            type: Date,
            required: [true, "Due date is required"]
        },

        completedDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Validate due date
taskSchema.pre("validate", function () {
    if (
        this.startDate &&
        this.dueDate &&
        this.dueDate < this.startDate
    ) {
        this.invalidate(
            "dueDate",
            "Due date must be on or after start date"
        );
    }
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
