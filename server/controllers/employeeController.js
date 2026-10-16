
const Employee = require("../models/Employee");
const Task = require("../models/Task");

// 1. Create employee
const createEmployee = async (req, res, next) => {
    try {
        const {
            employeeId,
            fullName,
            email,
            phone,
            department,
            role,
            joiningDate,
            status,
            skills,
            leaveStart,
            leaveEnd
        } = req.body;

        if (
            !employeeId ||
            !fullName ||
            !email ||
            !phone ||
            !department ||
            !role ||
            !joiningDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required employee fields"
            });
        }

        const employeeStatus = status || "Active";

        const validStatuses = [
            "Active",
            "Inactive",
            "On Leave"
        ];

        if (!validStatuses.includes(employeeStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee status"
            });
        }

        let validatedLeaveStart = null;
        let validatedLeaveEnd = null;

        if (employeeStatus === "On Leave") {
            if (!leaveStart || !leaveEnd) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Leave start date and end date are required"
                });
            }

            validatedLeaveStart = new Date(leaveStart);
            validatedLeaveEnd = new Date(leaveEnd);

            if (
                Number.isNaN(validatedLeaveStart.getTime()) ||
                Number.isNaN(validatedLeaveEnd.getTime())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid leave dates"
                });
            }

            if (validatedLeaveStart > validatedLeaveEnd) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Leave end date must be on or after leave start date"
                });
            }
        }

        const employee = await Employee.create({
            employeeId,
            fullName,
            email: email.trim().toLowerCase(),
            phone,
            department,
            role,
            joiningDate,
            status: employeeStatus,
            skills: skills || [],
            leaveStart: validatedLeaveStart,
            leaveEnd: validatedLeaveEnd
        });

        return res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: employee
        });
    } catch (error) {
        next(error);
    }
};

// 2. Get all employees with pagination, search, filters and sorting
const getAllEmployees = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            department,
            status,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        const currentPage = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const pageSize = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 10)
        );

        const skip = (currentPage - 1) * pageSize;
        const filter = {};

        if (search.trim()) {
            const escapedSearch = search
                .trim()
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            const regex = new RegExp(escapedSearch, "i");

            filter.$or = [
                { fullName: regex },
                { email: regex },
                { employeeId: regex }
            ];
        }

        const validDepartments = [
            "Development",
            "Design",
            "QA",
            "HR",
            "Sales"
        ];

        if (department) {
            if (!validDepartments.includes(department)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department filter"
                });
            }

            filter.department = department;
        }

        const validStatuses = [
            "Active",
            "Inactive",
            "On Leave"
        ];

        if (status) {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid employee status filter"
                });
            }

            filter.status = status;
        }

        const allowedSortFields = [
            "fullName",
            "employeeId",
            "joiningDate",
            "createdAt"
        ];

        if (!allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort field"
            });
        }

        const sort = {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
            _id: 1
        };

        const [employees, totalEmployees] = await Promise.all([
            Employee.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(pageSize)
                .lean(),

            Employee.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            count: employees.length,
            pagination: {
                totalEmployees,
                currentPage,
                totalPages: Math.ceil(
                    totalEmployees / pageSize
                ),
                limit: pageSize,
                hasNextPage:
                    currentPage * pageSize < totalEmployees,
                hasPreviousPage: currentPage > 1
            },
            data: employees
        });
    } catch (error) {
        next(error);
    }
};

// 3. Get employee by ID
const getEmployeeById = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: employee
        });
    } catch (error) {
        next(error);
    }
};

// 4. Update employee
const updateEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        const allowedFields = [
            "fullName",
            "email",
            "phone",
            "department",
            "role",
            "joiningDate",
            "status",
            "skills",
            "leaveStart",
            "leaveEnd"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const newStatus =
            updates.status !== undefined
                ? updates.status
                : employee.status;

        const newLeaveStart =
            updates.leaveStart !== undefined
                ? updates.leaveStart
                : employee.leaveStart;

        const newLeaveEnd =
            updates.leaveEnd !== undefined
                ? updates.leaveEnd
                : employee.leaveEnd;

        const validStatuses = [
            "Active",
            "Inactive",
            "On Leave"
        ];

        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employee status"
            });
        }

        if (newStatus === "On Leave") {
            if (!newLeaveStart || !newLeaveEnd) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Leave start date and end date are required"
                });
            }

            const leaveStart = new Date(newLeaveStart);
            const leaveEnd = new Date(newLeaveEnd);

            if (
                Number.isNaN(leaveStart.getTime()) ||
                Number.isNaN(leaveEnd.getTime())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid leave dates"
                });
            }

            if (leaveStart > leaveEnd) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Leave end date must be on or after leave start date"
                });
            }
        }

        // Reject status changes when active tasks exist
        if (
            newStatus !== employee.status &&
            ["Inactive", "On Leave"].includes(newStatus)
        ) {
            const activeTasks = await Task.countDocuments({
                assignedTo: employee._id,
                status: {
                    $in: ["Todo", "In Progress"]
                }
            });

            if (activeTasks > 0) {
                return res.status(409).json({
                    success: false,
                    message:
                        "Cannot change employee status while active tasks exist"
                });
            }
        }

        for (const [field, value] of Object.entries(updates)) {
            employee[field] = value;
        }

        if (updates.email !== undefined) {
            employee.email = updates.email.trim().toLowerCase();
        }

        // Remove leave dates when employee is not on leave
        if (newStatus !== "On Leave") {
            employee.leaveStart = null;
            employee.leaveEnd = null;
        } else {
            employee.leaveStart = new Date(newLeaveStart);
            employee.leaveEnd = new Date(newLeaveEnd);
        }

        await employee.save();

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: employee
        });
    } catch (error) {
        next(error);
    }
};

// 5. Delete employee
const deleteEmployee = async (req, res, next) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        const activeTasks = await Task.countDocuments({
            assignedTo: employee._id,
            status: {
                $in: ["Todo", "In Progress"]
            }
        });

        if (activeTasks > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot delete employee while active tasks exist"
            });
        }

        // Preserve employee details for historical tasks
        await Task.updateMany(
            { assignedTo: employee._id },
            {
                $set: {
                    assignedEmployeeSnapshot: {
                        employeeId: employee.employeeId,
                        fullName: employee.fullName,
                        email: employee.email,
                        department: employee.department
                    }
                }
            }
        );

        await Employee.findByIdAndDelete(employee._id);

        return res.status(200).json({
            success: true,
            message: "Employee deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Export all controllers
module.exports = {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
};
