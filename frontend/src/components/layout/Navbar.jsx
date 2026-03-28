import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useTheme from "../../hooks/useTheme";
import Logout from "../Logout";

export default function Navbar() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isHomeRoute = location.pathname === "/admin" || location.pathname === "/teacher";
  const links =
    user?.role === "admin"
      ? [{ to: "/admin", label: "Dashboard" }]
      : [{ to: "/teacher", label: "Students" }];

  return (
    <header className="border-b border-app bg-panel px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isHomeRoute}
            className="rounded-full border border-app bg-card px-4 py-2 text-sm font-semibold text-app transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {links.map((link) => {
            const active = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-950 text-white"
                    : "border border-app bg-card text-app hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-300">
              Student Profile QR
            </p>
            <h2 className="truncate text-lg font-semibold text-app sm:text-xl">
              {user?.role === "admin" ? "Admin" : "Teacher"}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-app bg-card px-4 py-2 text-sm font-semibold text-app transition hover:bg-muted"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <span className="rounded-full bg-muted px-3 py-2 text-sm font-medium capitalize text-app-secondary">
            {user?.role}
          </span>
          <Logout />
        </div>
      </div>
    </header>
  );
}
