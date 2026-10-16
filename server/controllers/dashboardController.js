
const Employee = require("../models/Employee");
const Task = require("../models/Task");

// GET /api/dashboard
const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();

        // Start of today, local server time
        today.setHours(0, 0, 0, 0);

        const [
            totalEmployees,
            activeEmployees,
            inactiveEmployees,
            employeesOnLeave,
            totalTasks,
            todoTasks,
            inProgressTasks,
            completedTasks,
            cancelledTasks,
            overdueTasks,
            workload
        ] = await Promise.all([
            Employee.countDocuments(),

            Employee.countDocuments({
                status: "Active"
            }),

            Employee.countDocuments({
                status: "Inactive"
            }),

            Employee.countDocuments({
                status: "On Leave"
            }),

            Task.countDocuments(),

            Task.countDocuments({
                status: "Todo"
            }),

            Task.countDocuments({
                status: "In Progress"
            }),

            Task.countDocuments({
                status: "Completed"
            }),

            Task.countDocuments({
                status: "Cancelled"
            }),

            Task.countDocuments({
                dueDate: { $lt: today },
                status: {
                    $nin: ["Completed", "Cancelled"]
                }
            }),

            Task.aggregate([
                {
                    $match: {
                        status: {
                            $in: ["Todo", "In Progress"]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$assignedTo",
                        activeTasks: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "_id",
                        foreignField: "_id",
                        as: "employee"
                    }
                },
                {
                    $unwind: {
                        path: "$employee",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 0,
                        employeeId: {
                            $ifNull: [
                                "$employee.employeeId",
                                null
                            ]
                        },
                        fullName: {
                            $ifNull: [
                                "$employee.fullName",
                                "Deleted Employee"
                            ]
                        },
                        activeTasks: 1
                    }
                },
                {
                    $sort: {
                        activeTasks: -1,
                        fullName: 1
                    }
                }
            ])
        ]);

        return res.status(200).json({
            success: true,
            data: {
                employees: {
                    total: totalEmployees,
                    active: activeEmployees,
                    inactive: inactiveEmployees,
                    onLeave: employeesOnLeave
                },
                tasks: {
                    total: totalTasks,
                    todo: todoTasks,
                    inProgress: inProgressTasks,
                    completed: completedTasks,
                    cancelled: cancelledTasks,
                    overdue: overdueTasks
                },
                workload
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats
};
