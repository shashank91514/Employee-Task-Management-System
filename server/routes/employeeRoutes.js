
const express = require("express");
const router = express.Router();

const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee
} = require("../controllers/employeeController");

// POST: Create employee
router.post("/", createEmployee);

// GET: Fetch all employees
router.get("/", getAllEmployees);

// GET: Fetch one employee by ID
router.get("/:id", getEmployeeById);

// PUT: Update employee
router.put("/:id", updateEmployee);

module.exports = router;
