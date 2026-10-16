
import { Bell, Search } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/": "Dashboard",
  "/employees": "Employees",
  "/tasks": "Tasks",
};

export default function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Workspace";

  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
      <div>
        <p className="text-xs text-slate-500">Workspace / {title}</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400 md:flex">
          <Search size={16} />
          <span>Team workspace</span>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
        >
          <Bell size={19} />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          WS
        </div>
      </div>
    </header>
  );
}
