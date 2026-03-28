import Navbar from "./Navbar.jsx";

export default function DashboardLayout({ children, hero }) {
  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar />
      <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {hero ? <div className="mb-6">{hero}</div> : null}
        {children}
      </main>
    </div>
  );
}
