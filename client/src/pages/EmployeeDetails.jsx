
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  Phone,
  UserRound,
  ClipboardList,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import api from "../services/api";

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-600",
  "On Leave": "bg-amber-50 text-amber-700",
};

const taskStatusStyles = {
  Todo: "bg-gray-100 text-gray-700",
  "In Progress": "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-red-50 text-red-700",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-gray-900">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default function EmployeeDetails() {
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskCount, setTaskCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    setTaskError("");

    try {
      const response = await api.get(`/employees/${id}`);
      const employeeData = response.data?.data;

      if (!employeeData) {
        throw new Error("The server did not return employee details.");
      }

      setEmployee(employeeData);

      try {
        const taskResponse = await api.get("/tasks", {
          params: {
            assignedTo: id,
            page: 1,
            limit: 5,
            sortBy: "createdAt",
            sortOrder: "desc",
          },
        });

        const result = taskResponse.data;
        setTasks(Array.isArray(result.data) ? result.data : []);
        setTaskCount(
          Number(
            result.pagination?.totalTasks ??
              result.pagination?.total ??
              result.count ??
              result.data?.length ??
              0
          )
        );
      } catch (taskErr) {
        setTasks([]);
        setTaskCount(0);
        setTaskError(getErrorMessage(taskErr));
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-gray-500">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        Loading employee profile...
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="font-semibold text-gray-900">
          Unable to load employee
        </p>
        <p className="mt-2 text-sm text-red-600">
          {error || "Employee not found."}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={fetchDetails}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Try Again
          </button>
          <Link
            to="/employees"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to Employees
          </Link>
        </div>
      </div>
    );
  }

  const skills = Array.isArray(employee.skills)
    ? employee.skills
    : typeof employee.skills === "string"
      ? employee.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
      : [];

  const activeTasks = tasks.filter(
    (task) => ["Todo", "In Progress"].includes(task.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/employees"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            Back to Employees
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
            Employee Profile
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View employee information and assigned tasks.
          </p>
        </div>

        <Link
          to={`/employees/${id}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Pencil size={17} />
          Edit Employee
        </Link>
      </div>

      {/* Employee identity */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-2 bg-indigo-600" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-3xl font-bold text-indigo-700">
            {employee.fullName?.trim().charAt(0).toUpperCase() || "E"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {employee.fullName}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  statusStyles[employee.status] || "bg-gray-100 text-gray-600"
                }`}
              >
                {employee.status || "Unknown"}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {employee.role || "Role not specified"} ·{" "}
              {employee.department || "Department not specified"}
            </p>
            <p className="mt-2 text-xs font-medium text-gray-400">
              Employee ID: {employee.employeeId || "—"}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl bg-gray-50 px-4 py-3 sm:self-center">
            <ClipboardList size={20} className="text-indigo-600" />
            <div>
              <p className="text-xl font-bold text-gray-900">{taskCount}</p>
              <p className="text-xs text-gray-500">Assigned tasks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact and employment */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-gray-900">Contact Information</h2>
          <div className="mt-5 space-y-5">
            <DetailItem
              icon={Mail}
              label="Email Address"
              value={employee.email}
            />
            <DetailItem
              icon={Phone}
              label="Phone Number"
              value={employee.phone}
            />
            <DetailItem
              icon={UserRound}
              label="Employee ID"
              value={employee.employeeId}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-gray-900">Employment Details</h2>
          <div className="mt-5 space-y-5">
            <DetailItem
              icon={BriefcaseBusiness}
              label="Department"
              value={employee.department}
            />
            <DetailItem
              icon={UserRound}
              label="Role / Designation"
              value={employee.role}
            />
            <DetailItem
              icon={CalendarDays}
              label="Joining Date"
              value={formatDate(employee.joiningDate)}
            />
          </div>
        </section>
      </div>

      {/* Skills */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-semibold text-gray-900">Skills</h2>

        {skills.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            No skills have been added for this employee.
          </p>
        )}
      </section>

      {/* Leave details */}
      {employee.status === "On Leave" && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6">
          <h2 className="font-semibold text-gray-900">Leave Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DetailItem
              icon={CalendarDays}
              label="Leave Start Date"
              value={formatDate(employee.leaveStart)}
            />
            <DetailItem
              icon={CalendarDays}
              label="Leave End Date"
              value={formatDate(employee.leaveEnd)}
            />
          </div>
        </section>
      )}

      {/* Assigned tasks */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Assigned Tasks</h2>
            <p className="mt-1 text-sm text-gray-500">
              Showing up to five recently created tasks.
            </p>
          </div>

          <Link
            to={`/tasks?assignedTo=${encodeURIComponent(id)}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View in Task Manager
            <ExternalLink size={15} />
          </Link>
        </div>

        {taskError ? (
          <div className="p-6 text-sm text-red-600">
            Unable to load assigned tasks: {taskError}
          </div>
        ) : tasks.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <ClipboardList
              size={30}
              className="mx-auto text-gray-300"
            />
            <p className="mt-3 font-medium text-gray-800">
              No assigned tasks found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Tasks assigned to this employee will appear here.
            </p>
            <Link
              to="/tasks/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Create Task
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">
                    {task.title || "Untitled task"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {task.taskId || task._id} · Due {formatDate(task.dueDate)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {task.priority && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {task.priority}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      taskStatusStyles[task.status] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {task.status || "Unknown"}
                  </span>
                </div>
              </div>
            ))}

            {taskCount > tasks.length && (
              <div className="px-5 py-3">
                <Link
                  to={`/tasks?assignedTo=${encodeURIComponent(id)}`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  View all {taskCount} tasks
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          onClick={fetchDetails}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh Profile
        </button>
      </div>
    </div>
  );
}
