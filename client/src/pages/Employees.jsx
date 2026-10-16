
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Users,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserRound,
} from "lucide-react";
import api from "../services/api";

const PAGE_SIZE = 10;

const departments = [
  "Development",
  "Design",
  "QA",
  "HR",
  "Sales",
];

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Inactive: "bg-gray-100 text-gray-600 ring-gray-500/20",
  "On Leave": "bg-amber-50 text-amber-700 ring-amber-600/20",
};

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

export default function Employees() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const department = searchParams.get("department") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateQuery = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
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

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/employees", {
        params: {
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: status || undefined,
          department: department || undefined,
        },
      });

      const result = response.data;
      const rows = Array.isArray(result.data) ? result.data : [];

      const total =
        Number(
          result.pagination?.totalEmployees ??
            result.pagination?.total ??
            result.count ??
            rows.length
        ) || 0;

      const totalPages =
        Number(result.pagination?.totalPages) ||
        Math.max(1, Math.ceil(total / PAGE_SIZE));

      setEmployees(rows);
      setPagination({ total, totalPages });
    } catch (err) {
      setEmployees([]);
      setPagination({ total: 0, totalPages: 1 });
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, department]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    updateQuery({ search: searchInput.trim(), page: 1 });
  }

  function handleFilterChange(key, value) {
    updateQuery({ [key]: value, page: 1 });
  }

  async function handleDelete(employee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.fullName}?`
    );

    if (!confirmed) return;

    setDeletingId(employee._id);

    try {
      await api.delete(`/employees/${employee._id}`);
      await fetchEmployees();
    } catch (err) {
      window.alert(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearchInput("");
    setSearchParams({});
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">
            Management
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            Employees
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage employee records, departments, and work status.
          </p>
        </div>

        <Link
          to="/employees/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Employee
        </Link>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Users size={23} />
          </div>
          <div>
            <p className="text-sm text-gray-500">
              Employees matching your filters
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {pagination.total}
            </p>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_200px_200px_auto]"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, email, or employee ID"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              handleFilterChange("status", event.target.value)
            }
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>

          <select
            value={department}
            onChange={(event) =>
              handleFilterChange("department", event.target.value)
            }
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              title="Clear filters"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Employee table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Employee Directory
          </h2>

          <button
            type="button"
            onClick={fetchEmployees}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <p className="font-medium text-red-600">
              Unable to load employees
            </p>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={fetchEmployees}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="text-sm text-gray-500">
              Loading employees...
            </p>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <UserRound size={27} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              No employees found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              Try changing your search or filters, or add your first employee.
            </p>
            <Link
              to="/employees/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={16} />
              Add Employee
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">
                      Employee
                    </th>
                    <th className="px-5 py-3.5 font-semibold">
                      Department / Role
                    </th>
                    <th className="px-5 py-3.5 font-semibold">
                      Phone
                    </th>
                    <th className="px-5 py-3.5 font-semibold">
                      Joining Date
                    </th>
                    <th className="px-5 py-3.5 font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {employees.map((employee) => (
                    <tr
                      key={employee._id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-700">
                            {employee.fullName
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() || "E"}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/employees/${employee._id}`}
                              className="font-semibold text-gray-900 hover:text-indigo-600"
                            >
                              {employee.fullName || "Unnamed employee"}
                            </Link>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {employee.employeeId || "No employee ID"}
                            </p>
                            <p className="max-w-[230px] truncate text-xs text-gray-500">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">
                          {employee.department || "—"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {employee.role || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {employee.phone || "—"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {employee.joiningDate
                          ? new Date(employee.joiningDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                            statusStyles[employee.status] ||
                            "bg-gray-100 text-gray-600 ring-gray-500/20"
                          }`}
                        >
                          {employee.status || "Unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/employees/${employee._id}`}
                            title="View employee"
                            aria-label={`View ${employee.fullName}`}
                            className="rounded-lg p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Eye size={17} />
                          </Link>

                          <Link
                            to={`/employees/${employee._id}/edit`}
                            title="Edit employee"
                            aria-label={`Edit ${employee.fullName}`}
                            className="rounded-lg p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Pencil size={17} />
                          </Link>

                          <button
                            type="button"
                            title="Delete employee"
                            aria-label={`Delete ${employee.fullName}`}
                            disabled={deletingId === employee._id}
                            onClick={() => handleDelete(employee)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === employee._id ? (
                              <RefreshCw
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {pagination.totalPages} ·{" "}
                {pagination.total} employee
                {pagination.total === 1 ? "" : "s"}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => updateQuery({ page: page - 1 })}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => updateQuery({ page: page + 1 })}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
