
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function MainLayout() {
  const mobileLinks = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Employees", path: "/employees", icon: Users },
    { label: "Tasks", path: "/tasks", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        <Header />

        <main className="p-4 pb-24 sm:p-6 lg:p-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 border-t border-slate-200 bg-white md:hidden">
        {mobileLinks.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 text-xs ${
                isActive
                  ? "text-indigo-600"
                  : "text-slate-500"
              }`
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
