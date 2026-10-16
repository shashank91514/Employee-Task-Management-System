
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";

import Employees from "./pages/Employees";
import EmployeeForm from "./pages/EmployeeForm";
import EmployeeDetails from "./pages/EmployeeDetails";

import Tasks from "./pages/Tasks";
import TaskForm from "./pages/TaskForm";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Dashboard */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* Employee Routes */}
          <Route
            path="/employees"
            element={<Employees />}
          />

          <Route
            path="/employees/new"
            element={<EmployeeForm />}
          />

          <Route
            path="/employees/:id/edit"
            element={<EmployeeForm />}
          />

          <Route
            path="/employees/:id"
            element={<EmployeeDetails />}
          />

          {/* Task Routes */}
          <Route
            path="/tasks"
            element={<Tasks />}
          />

          <Route
            path="/tasks/new"
            element={<TaskForm />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
