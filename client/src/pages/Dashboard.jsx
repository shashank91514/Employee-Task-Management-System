
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  ClipboardList,
  Clock3,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  PlayCircle,
  XCircle,
} from "lucide-react";
import api from "../services/api";

const statusItems = [
  {
    label: "Todo",
    key: "todo",
    icon: CircleDashed,
    color: "bg-slate-500",
  },
  {
    label: "In Progress",
    key: "inProgress",
    icon: PlayCircle,
    color: "bg-blue-500",
  },
  {
    label: "Completed",
    key: "completed",
    icon: CheckCircle2,
    color: "bg-green-500",
  },
  {
    label: "Cancelled",
    key: "cancelled",
    icon: XCircle,
    color: "bg-red-500",
  },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard");

      if (!response.data?.success) {
        throw new Error("Invalid dashboard response.");
      }

      setData(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const employees = data?.employees || {};
  const tasks = data?.tasks || {};
  const workload = data?.workload || [];

  const cards = [
    {
      label: "Total Employees",
      value: employees.total ?? 0,
      description: "All registered employees",
      icon: Users,
      style: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Active Employees",
      value: employees.active ?? 0,
      description: "Currently active",
      icon: UserCheck,
      style: "bg-green-50 text-green-600",
    },
    {
      label: "Total Tasks",
      value: tasks.total ?? 0,
      description: "All recorded tasks",
      icon: ClipboardList,
      style: "bg-blue-50 text-blue-600",
    },
    {
      label: "Overdue Tasks",
      value: tasks.overdue ?? 0,
      description: "Past due and not completed",
      icon: Clock3,
      style: "bg-red-50 text-red-600",
    },
  ];

  const statusTotal =
    (tasks.todo ?? 0) +
    (tasks.inProgress ?? 0) +
    (tasks.completed ?? 0) +
    (tasks.cancelled ?? 0);

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            OVERVIEW
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor employees, tasks, and team workload.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </span>
          <button
            onClick={fetchDashboard}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {loading ? "—" : card.value.toLocaleString()}
                  </p>
                </div>

                <div className={`rounded-xl p-3 ${card.style}`}>
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Task Status
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Distribution of all tasks
              </p>
            </div>

            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"
            >
              View tasks <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            {statusItems.map((item) => {
              const Icon = item.icon;
              const count = tasks[item.key] ?? 0;
              const percentage =
                statusTotal > 0 ? (count / statusTotal) * 100 : 0;

              return (
                <div key={item.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Icon size={17} />
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {loading ? "—" : count}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${item.color}`}
                      style={{
                        width: loading ? "0%" : `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Employee Workload
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Active tasks per employee
              </p>
            </div>

            <Link
              to="/employees"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"
            >
              Employees <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading workload...
              </p>
            ) : workload.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-10 text-center">
                <Users size={28} className="mx-auto text-slate-400" />
                <p className="mt-3 text-sm text-slate-600">
                  No workload data available.
                </p>
              </div>
            ) : (
              workload.slice(0, 6).map((employee, index) => {
                const count = employee.activeTasks ?? 0;

                return (
                  <div
                    key={employee.employeeId || employee._id || index}
                    className="rounded-xl border border-slate-100 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {employee.fullName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Employee ID: {employee.employeeId || "—"}
                        </p>
                      </div>

                      <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                        {count} / 3 tasks
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          count >= 3 ? "bg-amber-500" : "bg-indigo-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (count / 3) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Quick Actions
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your team and assign new work.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/employees/new"
            className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <span className="flex items-center gap-3">
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Users size={20} />
              </span>
              <span>
                <span className="block font-semibold text-slate-800">
                  Add Employee
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Register a new team member
                </span>
              </span>
            </span>
            <ArrowRight size={18} className="text-slate-400" />
          </Link>

          <Link
            to="/tasks/new"
            className="flex items-center justify-between rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <span className="flex items-center gap-3">
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <ClipboardList size={20} />
              </span>
              <span>
                <span className="block font-semibold text-slate-800">
                  Create Task
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Assign work to an employee
                </span>
              </span>
            </span>
            <ArrowRight size={18} className="text-slate-400" />
          </Link>
        </div>
      </section>
    </div>
  );
}
