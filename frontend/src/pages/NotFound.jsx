import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#cffafe_0%,#f8fafc_40%,#e2e8f0_100%)] px-6 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-3xl flex-col items-center justify-center rounded-[32px] border border-white/60 bg-white/80 p-10 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <p className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700">
          Page not found
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
          This route does not exist in the student profile portal.
        </h1>
        <p className="mt-4 max-w-xl text-base text-slate-600">
          Use the dashboard navigation if you are signed in, or head back to the
          login screen to start a new session.
        </p>
        <Link
          to="/"
          className="mt-8 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back To Login
        </Link>
      </div>
    </div>
  );
}
