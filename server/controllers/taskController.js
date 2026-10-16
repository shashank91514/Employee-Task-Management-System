
const Task = require("../models/Task");
const Employee = require("../models/Employee");

// Helper: Employee information preserve karna
const getAssignedEmployee = (task) => {
    return (
        task.assignedTo ||
        task.assignedEmployeeSnapshot ||
        null
    );
};

// Helper: Employee assignment validate karna
const validateEmployeeAssignment = async (
    employeeId,
    startDate,
    excludeTaskId = null
) => {
    const employee = await Employee.findById(employeeId);

    if (!employee) {
        const error = new Error("Assigned employee not found");
        error.statusCode = 404;
        throw error;
    }

    if (employee.status === "Inactive") {
        const error = new Error(
            "Cannot assign a task to an inactive employee"
        );
        error.statusCode = 409;
        throw error;
    }

    if (employee.status === "On Leave") {
        if (!employee.leaveStart || !employee.leaveEnd) {
            const error = new Error(
                "Employee leave dates are missing"
            );
            error.statusCode = 409;
            throw error;
        }

        const leaveStart = new Date(employee.leaveStart);
        const leaveEnd = new Date(employee.leaveEnd);

        if (leaveStart > leaveEnd) {
            const error = new Error(
                "Employee leave dates are invalid"
            );
            error.statusCode = 409;
            throw error;
        }

        if (
            startDate >= leaveStart &&
            startDate <= leaveEnd
        ) {
            const error = new Error(
                "Task cannot start during employee leave"
            );
            error.statusCode = 409;
            throw error;
        }
    }

    const activeTaskFilter = {
        assignedTo: employee._id,
        status: { $in: ["Todo", "In Progress"] }
    };

    if (excludeTaskId) {
        activeTaskFilter._id = { $ne: excludeTaskId };
    }

    const activeTaskCount = await Task.countDocuments(
        activeTaskFilter
    );

    if (activeTaskCount >= 3) {
        const error = new Error(
            "Employee already has 3 active tasks"
        );
        error.statusCode = 409;
        throw error;
    }

    return employee;
};

// 1. Create a new task
const createTask = async (req, res, next) => {
    try {
        const {
            title,
            description,
            assignedTo,
            priority,
            startDate,
            dueDate
        } = req.body;

        if (
            !title ||
            !description ||
            !assignedTo ||
            !startDate ||
            !dueDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Title, description, assigned employee, start date and due date are required"
            });
        }

        const start = new Date(startDate);
        const due = new Date(dueDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(due.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid start date or due date"
            });
        }

        if (due < start) {
            return res.status(400).json({
                success: false,
                message:
                    "Due date must be on or after start date"
            });
        }

        const employee = await validateEmployeeAssignment(
            assignedTo,
            start
        );

        const task = await Task.create({
            title,
            description,
            assignedTo: employee._id,
            assignedEmployeeSnapshot: {
                employeeId: employee.employeeId,
                fullName: employee.fullName,
                email: employee.email,
                department: employee.department
            },
            department: employee.department,
            priority: priority || "Medium",
            startDate: start,
            dueDate: due
        });

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: {
                ...task.toObject(),
                assignedEmployee: task.assignedEmployeeSnapshot
            }
        });
    } catch (error) {
        next(error);
    }
};

// 2. Get all tasks with pagination, search, filters and sorting
const getAllTasks = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            status,
            priority,
            department,
            assignedTo,
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

        const filter = {};

        if (search.trim()) {
            const escapedSearch = search
                .trim()
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            const regex = new RegExp(escapedSearch, "i");

            filter.$or = [
                { title: regex },
                { description: regex },
                { taskId: regex }
            ];
        }

        const validStatuses = [
            "Todo",
            "In Progress",
            "Completed",
            "Cancelled"
        ];

        const validPriorities = [
            "Low",
            "Medium",
            "High",
            "Critical"
        ];

        const validDepartments = [
            "Development",
            "Design",
            "QA",
            "HR",
            "Sales"
        ];

        if (status) {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status filter"
                });
            }

            filter.status = status;
        }

        if (priority) {
            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid priority filter"
                });
            }

            filter.priority = priority;
        }

        if (department) {
            if (!validDepartments.includes(department)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department filter"
                });
            }

            filter.department = department;
        }

        if (assignedTo) {
            if (!/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assigned employee ID"
                });
            }

            filter.assignedTo = assignedTo;
        }

        const allowedSortFields = [
            "title",
            "taskId",
            "dueDate",
            "startDate",
            "createdAt",
            "priority",
            "status"
        ];

        if (!allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort field"
            });
        }

        const sortDirection = sortOrder === "asc" ? 1 : -1;

        const sort = {
            [sortBy]: sortDirection,
            _id: 1
        };

        const skip = (currentPage - 1) * pageSize;

        const [tasks, totalTasks] = await Promise.all([
            Task.find(filter)
                .populate(
                    "assignedTo",
                    "employeeId fullName email department"
                )
                .sort(sort)
                .skip(skip)
                .limit(pageSize)
                .lean(),

            Task.countDocuments(filter)
        ]);

        const formattedTasks = tasks.map((task) => ({
            ...task,
            assignedEmployee: getAssignedEmployee(task),
            isOverdue:
                !["Completed", "Cancelled"].includes(task.status) &&
                new Date() > new Date(task.dueDate)
        }));

        return res.status(200).json({
            success: true,
            count: formattedTasks.length,
            pagination: {
                currentPage,
                pageSize,
                totalTasks,
                totalPages: Math.ceil(totalTasks / pageSize)
            },
            data: formattedTasks
        });
    } catch (error) {
        next(error);
    }
};

// 3. Get one task by ID
const getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate(
                "assignedTo",
                "employeeId fullName email department"
            )
            .lean();

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                ...task,
                assignedEmployee: getAssignedEmployee(task),
                isOverdue:
                    !["Completed", "Cancelled"].includes(task.status) &&
                    new Date() > new Date(task.dueDate)
            }
        });
    } catch (error) {
        next(error);
    }
};

// 4. Update task status
const updateTaskStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const allowedTransitions = {
            Todo: ["In Progress", "Cancelled"],
            "In Progress": ["Completed", "Cancelled"]
        };

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        if (["Completed", "Cancelled"].includes(task.status)) {
            return res.status(409).json({
                success: false,
                message:
                    "Completed or cancelled tasks cannot change status"
            });
        }

        if (!allowedTransitions[task.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    `Cannot change status from ${task.status} to ${status}`
            });
        }

        if (status === "Completed") {
            task.completedDate = new Date();
        }

        task.status = status;

        await task.save();

        return res.status(200).json({
            success: true,
            message: "Task status updated successfully",
            data: task
        });
    } catch (error) {
        next(error);
    }
};

// 5. Update task details
const updateTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        if (["Completed", "Cancelled"].includes(task.status)) {
            return res.status(409).json({
                success: false,
                message:
                    "Completed or cancelled tasks cannot be edited"
            });
        }

        if (
            req.body.status !== undefined ||
            req.body.completedDate !== undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Status and completedDate cannot be updated through this endpoint"
            });
        }

        const allowedFields = [
            "title",
            "description",
            "assignedTo",
            "priority",
            "startDate",
            "dueDate"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const startDate =
            updates.startDate !== undefined
                ? new Date(updates.startDate)
                : new Date(task.startDate);

        const dueDate =
            updates.dueDate !== undefined
                ? new Date(updates.dueDate)
                : new Date(task.dueDate);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(dueDate.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid start date or due date"
            });
        }

        if (dueDate < startDate) {
            return res.status(400).json({
                success: false,
                message:
                    "Due date must be on or after start date"
            });
        }

        const employeeId = updates.assignedTo || task.assignedTo;

        const employee = await validateEmployeeAssignment(
            employeeId,
            startDate,
            task._id
        );

        for (const [field, value] of Object.entries(updates)) {
            if (field === "startDate") {
                task.startDate = startDate;
            } else if (field === "dueDate") {
                task.dueDate = dueDate;
            } else if (field === "assignedTo") {
                task.assignedTo = employee._id;
            } else {
                task[field] = value;
            }
        }

        task.department = employee.department;

        task.assignedEmployeeSnapshot = {
            employeeId: employee.employeeId,
            fullName: employee.fullName,
            email: employee.email,
            department: employee.department
        };

        await task.save();

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: {
                ...task.toObject(),
                assignedEmployee: task.assignedEmployeeSnapshot
            }
        });
    } catch (error) {
        next(error);
    }
};

// Helper: CSV field escaping and spreadsheet formula protection
const escapeCSV = (value) => {
    let text = value == null ? "" : String(value);

    if (/^[\s]*[=+\-@]/.test(text)) {
        text = "'" + text;
    }

    return `"${text.replace(/"/g, '""')}"`;
};

// 6. Export tasks to CSV
const exportTasksCSV = async (req, res, next) => {
    try {
        const {
            search = "",
            status,
            priority,
            department,
            assignedTo
        } = req.query;

        const filter = {};

        if (search.trim()) {
            const escapedSearch = search
                .trim()
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            const regex = new RegExp(escapedSearch, "i");

            filter.$or = [
                { title: regex },
                { description: regex },
                { taskId: regex }
            ];
        }

        const validStatuses = [
            "Todo",
            "In Progress",
            "Completed",
            "Cancelled"
        ];

        const validPriorities = [
            "Low",
            "Medium",
            "High",
            "Critical"
        ];

        const validDepartments = [
            "Development",
            "Design",
            "QA",
            "HR",
            "Sales"
        ];

        if (status) {
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status filter"
                });
            }

            filter.status = status;
        }

        if (priority) {
            if (!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid priority filter"
                });
            }

            filter.priority = priority;
        }

        if (department) {
            if (!validDepartments.includes(department)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department filter"
                });
            }

            filter.department = department;
        }

        if (assignedTo) {
            if (!/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assigned employee ID"
                });
            }

            filter.assignedTo = assignedTo;
        }

        // Fetch all matching tasks without pagination
        const tasks = await Task.find(filter)
            .populate(
                "assignedTo",
                "employeeId fullName email department"
            )
            .sort({ createdAt: -1 })
            .lean();

        const headers = [
            "Task ID",
            "Title",
            "Description",
            "Employee ID",
            "Employee Name",
            "Employee Email",
            "Department",
            "Priority",
            "Status",
            "Start Date",
            "Due Date",
            "Created Date",
            "Completed Date",
            "Overdue"
        ];

        const rows = tasks.map((task) => {
            const employee = getAssignedEmployee(task) || {};

            const isOverdue =
                !["Completed", "Cancelled"].includes(task.status) &&
                new Date() > new Date(task.dueDate);

            const toISO = (date) =>
                date ? new Date(date).toISOString() : "";

            return [
                task.taskId,
                task.title,
                task.description,
                employee.employeeId,
                employee.fullName,
                employee.email,
                task.department,
                task.priority,
                task.status,
                toISO(task.startDate),
                toISO(task.dueDate),
                toISO(task.createdAt),
                toISO(task.completedDate),
                isOverdue ? "Yes" : "No"
            ];
        });

        const csvContent = [
            headers.map(escapeCSV).join(","),
            ...rows.map((row) =>
                row.map(escapeCSV).join(",")
            )
        ].join("\r\n");

        const csvWithBOM = "\uFEFF" + csvContent;

        res.setHeader(
            "Content-Type",
            "text/csv; charset=utf-8"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="tasks-export.csv"'
        );

        return res.status(200).send(csvWithBOM);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    updateTaskStatus,
    updateTask,
    exportTasksCSV
};
