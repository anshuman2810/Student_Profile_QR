import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import API, { extractErrorMessage } from "../api/axios";
import { setCredentials } from "../features/auth/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.role) return;

    const from = location.state?.from?.pathname;
    navigate(from || (user.role === "admin" ? "/admin" : "/teacher"), {
      replace: true,
    });
  }, [isAuthenticated, location.state, navigate, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await API.post("/auth/login", form);
      dispatch(setCredentials(res.data.token));
    } catch (requestError) {
      setError(extractErrorMessage(requestError, "Unable to sign in."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#155e75_35%,#ecfeff_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="text-white">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-semibold tracking-tight">
              Student Profile QR
            </h1>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(8,47,73,0.35)] backdrop-blur">
          <h2 className="mb-8 text-3xl font-semibold text-slate-950">Sign in</h2>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <span>Email</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                placeholder="admin@school.com"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
                type="email"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              <span>Password</span>
              <div className="flex rounded-2xl border border-slate-200 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
                <input
                  className="min-w-0 flex-1 rounded-l-2xl px-4 py-3 text-slate-900 outline-none"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="rounded-r-2xl border-l border-slate-200 px-4 text-sm font-semibold text-slate-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
