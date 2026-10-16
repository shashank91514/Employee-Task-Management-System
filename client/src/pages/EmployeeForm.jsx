
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import api from "../services/api";

const departments = ["Development", "Design", "QA", "HR", "Sales"];
const statuses = ["Active", "Inactive", "On Leave"];

const initialForm = {
  employeeId: "",
  fullName: "",
  email: "",
  phone: "",
  department: "Development",
  role: "",
  joiningDate: "",
  status: "Active",
  skills: "",
  leaveStart: "",
  leaveEnd: "",
};

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;

    async function loadEmployee() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/employees/${id}`);
        const employee = response.data?.data;

        if (!employee) {
          throw new Error("Employee details were not returned by the server.");
        }

        if (cancelled) return;

        setForm({
          employeeId: employee.employeeId || "",
          fullName: employee.fullName || "",
          email: employee.email || "",
          phone: employee.phone || "",
          department: employee.department || "Development",
          role: employee.role || "",
          joiningDate: toDateInput(employee.joiningDate),
          status: employee.status || "Active",
          skills: Array.isArray(employee.skills)
            ? employee.skills.join(", ")
            : employee.skills || "",
          leaveStart: toDateInput(employee.leaveStart),
          leaveEnd: toDateInput(employee.leaveEnd),
        });
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEmployee();

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
  }

  function validateForm() {
    const errors = {};

    const requiredFields = [
      ["employeeId", "Employee ID is required."],
      ["fullName", "Full name is required."],
      ["email", "Email is required."],
      ["phone", "Phone number is required."],
      ["department", "Please select a department."],
      ["role", "Role is required."],
      ["joiningDate", "Joining date is required."],
      ["status", "Please select a status."],
    ];

    requiredFields.forEach(([field, message]) => {
      if (!String(form[field] || "").trim()) {
        errors[field] = message;
      }
    });

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      errors.email = "Enter a valid email address.";
    }

    if (form.phone.trim() && !/^[+()\d\s-]{7,20}$/.test(form.phone.trim())) {
      errors.phone = "Enter a valid phone number.";
    }

    if (
      form.joiningDate &&
      form.joiningDate > new Date().toISOString().slice(0, 10)
    ) {
      errors.joiningDate = "Joining date cannot be in the future.";
    }

    if (form.status === "On Leave") {
      if (!form.leaveStart) {
        errors.leaveStart = "Leave start date is required.";
      }

      if (!form.leaveEnd) {
        errors.leaveEnd = "Leave end date is required.";
      }

      if (
        form.leaveStart &&
        form.leaveEnd &&
        form.leaveEnd < form.leaveStart
      ) {
        errors.leaveEnd = "Leave end date cannot precede the start date.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!validateForm()) return;

    const payload = {
      employeeId: form.employeeId.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      department: form.department,
      role: form.role.trim(),
      joiningDate: form.joiningDate,
      status: form.status,
      skills: form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      leaveStart: form.status === "On Leave" ? form.leaveStart : null,
      leaveEnd: form.status === "On Leave" ? form.leaveEnd : null,
    };

    setSaving(true);

    try {
      if (isEditing) {
        await api.put(`/employees/${id}`, payload);
      } else {
        await api.post("/employees", payload);
      }

      navigate("/employees");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function inputClass(field) {
    return `mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 ${
      fieldErrors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-100"
    }`;
  }

  function renderError(field) {
    return fieldErrors[field] ? (
      <p className="mt-1 text-xs text-red-600">{fieldErrors[field]}</p>
    ) : null;
  }

  function renderInput({
    name,
    label,
    type = "text",
    placeholder = "",
    required = false,
    disabled = false,
  }) {
    return (
      <div key={name}>
        <label
          htmlFor={name}
          className="text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        <input
          id={name}
          name={name}
          type={type}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${inputClass(name)} ${
            disabled ? "cursor-not-allowed bg-gray-100 text-gray-500" : ""
          }`}
        />

        {renderError(name)}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-gray-500">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        Loading employee details...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to Employees
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <UserPlus size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {isEditing ? "Edit Employee" : "Add Employee"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing
                ? "Update employee information and employment status."
                : "Enter the details to create an employee record."}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-semibold text-gray-900">
            Personal Information
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Basic employee contact details.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {renderInput({
              name: "employeeId",
              label: "Employee ID",
              placeholder: "e.g. EMP001",
              required: true,
              disabled: isEditing,
            })}

            {renderInput({
              name: "fullName",
              label: "Full Name",
              placeholder: "Enter full name",
              required: true,
            })}

            {renderInput({
              name: "email",
              label: "Email Address",
              type: "email",
              placeholder: "employee@company.com",
              required: true,
            })}

            {renderInput({
              name: "phone",
              label: "Phone Number",
              placeholder: "Enter phone number",
              required: true,
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-semibold text-gray-900">
            Employment Information
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Department, role, joining date, and status.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="department"
                className="text-sm font-medium text-gray-700"
              >
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                className={inputClass("department")}
                required
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              {renderError("department")}
            </div>

            {renderInput({
              name: "role",
              label: "Role / Designation",
              placeholder: "e.g. Software Developer",
              required: true,
            })}

            {renderInput({
              name: "joiningDate",
              label: "Joining Date",
              type: "date",
              required: true,
            })}

            <div>
              <label
                htmlFor="status"
                className="text-sm font-medium text-gray-700"
              >
                Employment Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass("status")}
                required
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {renderError("status")}
            </div>

            <div className="sm:col-span-2">
              {renderInput({
                name: "skills",
                label: "Skills",
                placeholder: "React, Node.js, MongoDB",
              })}
              <p className="mt-1.5 text-xs text-gray-500">
                Separate skills with commas.
              </p>
            </div>
          </div>
        </section>

        {form.status === "On Leave" && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm sm:p-7">
            <h2 className="font-semibold text-gray-900">
              Leave Information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the dates of the employee's leave.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {renderInput({
                name: "leaveStart",
                label: "Leave Start Date",
                type: "date",
                required: true,
              })}

              {renderInput({
                name: "leaveEnd",
                label: "Leave End Date",
                type: "date",
                required: true,
              })}
            </div>
          </section>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/employees"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {saving
              ? "Saving..."
              : isEditing
                ? "Update Employee"
                : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
