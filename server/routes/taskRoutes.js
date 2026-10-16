
const express = require("express");
const router = express.Router();

const {
    createTask,
    getAllTasks,
    getTaskById,
    updateTaskStatus,
    updateTask,
    exportTasksCSV
} = require("../controllers/taskController");

// Create task
router.post("/", createTask);

// Get all tasks with pagination, search and filters
router.get("/", getAllTasks);

// Export tasks to CSV (must come before /:id)
router.get("/export/csv", exportTasksCSV);

// Update task status only
router.patch("/:id/status", updateTaskStatus);

// Edit task details
router.put("/:id", updateTask);

// Get one task
router.get("/:id", getTaskById);

module.exports = router;
