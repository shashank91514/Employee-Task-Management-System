
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Play,
  CheckCircle,
  XCircle,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";

const PAGE_SIZE = 10;

const STATUSES = ["Todo", "In Progress", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const DEPARTMENTS = ["Development", "Design", "QA", "HR", "Sales"];

const STATUS_STYLES = {
  Todo: "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const PRIORITY_STYLES = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-amber-50 text-amber-700",
  Critical: "bg-red-50 text-red-700",
};

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function isOverdue(task) {
  if (!task.dueDate || ["Completed", "Cancelled"].includes(task.status)) {
    return false;
  }

  const dueDate = new Date(task.dueDate);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function getEmployeeName(task) {
  return (
    task.assignedEmployee?.fullName ||
    task.assignedTo?.fullName ||
    task.assignedEmployeeSnapshot?.fullName ||
    task.employeeSnapshot?.fullName ||
    "Employee unavailable"
  );
}

function getAllowedActions(status) {
  if (status === "Todo") {
    return [
      { status: "In Progress", label: "Start", icon: Play },
      { status: "Cancelled", label: "Cancel", icon: XCircle },
    ];
  }

  if (status === "In Progress") {
    return [
      { status: "Completed", label: "Complete", icon: CheckCircle },
      { status: "Cancelled", label: "Cancel", icon: XCircle },
    ];
  }

  return [];
}

function getErrorMessage(error, fallback) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    fallback
  );
}

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const department = searchParams.get("department") || "";
  const assignedTo = searchParams.get("assignedTo") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1
  );

  const [searchInput, setSearchInput] = useState(search);
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateParams = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(changes).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/tasks", {
        params: {
          search: search || undefined,
          status: status || undefined,
          priority: priority || undefined,
          department: department || undefined,
          assignedTo: assignedTo || undefined,
          sortBy,
          sortOrder,
          page,
          limit: PAGE_SIZE,
        },
      });

      const result = response.data;

      const rows = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      const pagination = result?.pagination || {};

      setTasks(rows);

      const totalTasks = Number(
        pagination.totalTasks ??
          pagination.total ??
          pagination.totalItems ??
          result?.total ??
          result?.count ??
          rows.length
      );

      setTotal(totalTasks);

      setTotalPages(
        Math.max(
          1,
          Number(
            pagination.totalPages ??
              result?.totalPages ??
              Math.ceil(totalTasks / PAGE_SIZE)
          ) || 1
        )
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not load tasks. Please check your backend."
        )
      );
      setTasks([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    status,
    priority,
    department,
    assignedTo,
    sortBy,
    sortOrder,
    page,
    refreshKey,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleStatusUpdate(task, nextStatus) {
    const confirmed = window.confirm(
      `Change task "${task.title}" from "${task.status}" to "${nextStatus}"?`
    );

    if (!confirmed) return;

    try {
      setUpdatingTaskId(task._id);
      setActionError("");
      setError("");

      // Matches taskRoutes.js: router.patch("/:id/status", ...)
      await api.patch(`/tasks/${task._id}/status`, {
        status: nextStatus,
      });

      setRefreshKey((current) => current + 1);
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          "Could not update task status. Check your status route."
        )
      );
    } finally {
      setUpdatingTaskId("");
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      setActionError("");

      // Matches taskRoutes.js: router.get("/export/csv", ...)
      const response = await api.get("/tasks/export/csv", {
        params: {
          search: search || undefined,
          status: status || undefined,
          priority: priority || undefined,
          department: department || undefined,
          assignedTo: assignedTo || undefined,
        },
        responseType: "blob",
      });

      const blobUrl = URL.createObjectURL(
        new Blob([response.data], {
          type: "text/csv;charset=utf-8;",
        })
      );

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "tasks.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          "CSV export failed. Check your export route."
        )
      );
    } finally {
      setExporting(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();

    updateParams({
      search: searchInput.trim(),
      page: 1,
    });
  }

  function resetFilters() {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, update, and track employee tasks.
          </p>

          {assignedTo && (
            <p className="mt-2 text-sm text-indigo-600">
              Showing tasks for the selected employee.
              <button
                type="button"
                onClick={() =>
                  updateParams({ assignedTo: "", page: 1 })
                }
                className="ml-2 font-semibold underline"
              >
                Clear employee filter
              </button>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Download size={17} />
            )}
            Export CSV
          </button>

          <Link
            to="/tasks/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={18} />
            Create Task
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        <div className="relative xl:col-span-2">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search task title or description..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={status}
          onChange={(event) =>
            updateParams({ status: event.target.value, page: 1 })
          }
          className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(event) =>
            updateParams({ priority: event.target.value, page: 1 })
          }
          className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={department}
          onChange={(event) =>
            updateParams({ department: event.target.value, page: 1 })
          }
          className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500"
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-6">
          <select
            value={sortBy}
            onChange={(event) =>
              updateParams({ sortBy: event.target.value, page: 1 })
            }
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500 sm:flex-none"
            aria-label="Sort tasks by"
          >
            <option value="createdAt">Created date</option>
            <option value="dueDate">Due date</option>
            <option value="startDate">Start date</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>

          <button
            type="button"
            onClick={() =>
              updateParams({
                sortOrder: sortOrder === "asc" ? "desc" : "asc",
                page: 1,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 hover:bg-slate-50"
            title={`Currently ${sortOrder === "asc" ? "ascending" : "descending"}`}
          >
            <ArrowUpDown size={16} />
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-700"
          >
            <Search size={16} />
            Search
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">Task</th>
              <th className="px-5 py-4 font-medium">Employee</th>
              <th className="px-5 py-4 font-medium">Department</th>
              <th className="px-5 py-4 font-medium">Priority</th>
              <th className="px-5 py-4 font-medium">Due date</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-slate-500"
                >
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle size={18} className="animate-spin" />
                    Loading tasks...
                  </span>
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-slate-500"
                >
                  No tasks match your filters.
                  <div className="mt-3">
                    <Link
                      to="/tasks/new"
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      Create your first task
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const actions = getAllowedActions(task.status);
                const overdue = isOverdue(task);

                return (
                  <tr key={task._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {task.taskId || task._id}
                      </p>
                      {overdue && (
                        <span className="mt-2 inline-block rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                          Overdue
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {getEmployeeName(task)}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {task.department ||
                        task.assignedEmployee?.department ||
                        task.assignedTo?.department ||
                        "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          PRIORITY_STYLES[task.priority] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.priority || "Medium"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          overdue
                            ? "font-medium text-red-600"
                            : "text-slate-600"
                        }
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                          STATUS_STYLES[task.status] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.status || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {actions.length === 0 ? (
                        <span className="text-xs text-slate-400">
                          No actions
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {actions.map(
                            ({ status: nextStatus, label, icon: Icon }) => (
                              <button
                                key={nextStatus}
                                type="button"
                                disabled={updatingTaskId === task._id}
                                onClick={() =>
                                  handleStatusUpdate(task, nextStatus)
                                }
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                                  nextStatus === "Completed"
                                    ? "border-green-200 text-green-700 hover:bg-green-50"
                                    : nextStatus === "Cancelled"
                                      ? "border-red-200 text-red-700 hover:bg-red-50"
                                      : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                }`}
                              >
                                {updatingTaskId === task._id ? (
                                  <LoaderCircle
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Icon size={13} />
                                )}
                                {label}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-500">
          Page {page} of {totalPages} · {total} task(s)
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => updateParams({ page: page - 1 })}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => updateParams({ page: page + 1 })}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
