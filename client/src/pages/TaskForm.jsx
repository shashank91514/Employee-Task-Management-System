
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const initialForm = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "Medium",
  startDate: "",
  dueDate: "",
};

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function TaskForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmployees() {
      try {
        const response = await api.get("/employees", {
          params: { limit: 100 },
        });

        const result = response.data?.data;
        setEmployees(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load employees."
        );
      } finally {
        setLoadingEmployees(false);
      }
    }

    loadEmployees();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.dueDate < form.startDate) {
      setError("Due date cannot be earlier than start date.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/tasks", {
        title: form.title.trim(),
        description: form.description.trim(),
        assignedTo: form.assignedTo,
        priority: form.priority,
        startDate: form.startDate,
        dueDate: form.dueDate,
      });

      navigate("/tasks");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create task."
      );
    } finally {
      setSaving(false);
    }
  }

  const eligibleEmployees = employees.filter(
    (employee) => employee.status !== "Inactive"
  );

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <Link
        to="/tasks"
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Back to Tasks
      </Link>

      <div className="mb-6 mt-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Create Task
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create a task and assign it to an employee.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <label className="block text-sm font-medium text-slate-700">
          Task Title *
          <input
            className={inputClass}
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Build employee dashboard"
            maxLength={150}
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Description *
          <textarea
            className={inputClass}
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe the task..."
            required
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Assigned Employee *
            <select
              className={inputClass}
              name="assignedTo"
              value={form.assignedTo}
              onChange={handleChange}
              disabled={loadingEmployees}
              required
            >
              <option value="">
                {loadingEmployees
                  ? "Loading employees..."
                  : "Select employee"}
              </option>

              {eligibleEmployees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.fullName} ({employee.employeeId})
                  {employee.status === "On Leave" ? " — On Leave" : ""}
                </option>
              ))}
            </select>

            <span className="mt-1 block text-xs text-slate-500">
              The backend validates leave dates and task capacity.
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Priority *
            <select
              className={inputClass}
              name="priority"
              value={form.priority}
              onChange={handleChange}
              required
            >
              {["Low", "Medium", "High", "Critical"].map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Start Date *
            <input
              className={inputClass}
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Due Date *
            <input
              className={inputClass}
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              min={form.startDate || undefined}
              required
            />
          </label>
        </div>

        {!loadingEmployees && eligibleEmployees.length === 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            No eligible employees found. Add an employee before creating a task.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Link
            to="/tasks"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving || loadingEmployees || eligibleEmployees.length === 0}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
