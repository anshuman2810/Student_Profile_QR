import { useCallback, useEffect, useMemo, useState } from "react";
import API, { extractErrorMessage } from "../api/axios";
import DownloadQR from "../components/DownloadQR";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatusToast from "../components/StatusToast";
import { getAcademicYearOptions } from "../utils/academicYears";
import { classOptions, sectionOptions } from "../utils/classroomOptions";
import { prepareProfileImage } from "../utils/image";
import { validatePassword } from "../utils/validation";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "teachers", label: "Teachers" },
  { id: "students", label: "Students" },
];

const studentPageSize = 8;

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-app-secondary">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="rounded-full border border-app bg-card px-4 py-2 text-sm font-semibold text-app transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-full border border-app bg-card px-4 py-2 text-sm font-semibold text-app transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [teacher, setTeacher] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [student, setStudent] = useState({
    name: "",
    rollNumber: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    academicYear: "",
    className: "",
    section: "",
    profileImage: "",
    assignedTeacher: "",
  });
  const [overview, setOverview] = useState({
    teacherCount: 0,
    studentCount: 0,
    classroomSummary: [],
  });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [teacherStatus, setTeacherStatus] = useState({ type: "", message: "" });
  const [studentStatus, setStudentStatus] = useState({ type: "", message: "" });
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [studentSubmitting, setStudentSubmitting] = useState(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [studentFilters, setStudentFilters] = useState({
    academicYear: "",
    className: "",
    section: "",
  });
  const [latestStudent, setLatestStudent] = useState(null);
  const [studentPage, setStudentPage] = useState(1);

  const academicYearOptions = useMemo(() => getAcademicYearOptions(), []);
  const passwordError = useMemo(() => validatePassword(teacher.password), [teacher.password]);
  const confirmPasswordError = useMemo(() => {
    if (!teacher.confirmPassword) return "";
    return teacher.password === teacher.confirmPassword ? "" : "Passwords do not match.";
  }, [teacher.confirmPassword, teacher.password]);

  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * studentPageSize;
    return students.slice(start, start + studentPageSize);
  }, [studentPage, students]);

  const totalStudentPages = Math.max(1, Math.ceil(students.length / studentPageSize));

  const loadDashboard = useCallback(async (filters = studentFilters) => {
    setStatus({ loading: true, error: "" });

    try {
      const [overviewResponse, teachersResponse, studentsResponse] = await Promise.all([
        API.get("/admin/overview"),
        API.get("/admin/teachers"),
        API.get("/admin/students", {
          params: {
            academicYear: filters.academicYear || undefined,
            className: filters.className || undefined,
            section: filters.section || undefined,
          },
        }),
      ]);

      setOverview(overviewResponse.data);
      setTeachers(teachersResponse.data);
      setStudents(studentsResponse.data);
      setStudentPage(1);
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({
        loading: false,
        error: extractErrorMessage(error, "Unable to load dashboard data."),
      });
    }
  }, [studentFilters]);

  useEffect(() => {
    const initializeDashboard = async () => {
      await loadDashboard();
    };

    initializeDashboard();
  }, [loadDashboard]);

  const handleTeacherSubmit = async (event) => {
    event.preventDefault();

    if (passwordError) {
      setTeacherStatus({ type: "error", message: passwordError });
      return;
    }

    if (confirmPasswordError) {
      setTeacherStatus({ type: "error", message: confirmPasswordError });
      return;
    }

    setTeacherSubmitting(true);
    setTeacherStatus({ type: "", message: "" });

    try {
      const { confirmPassword: _confirmPassword, ...teacherPayload } = teacher;
      const { data } = await API.post("/admin/teacher", teacherPayload);
      setTeacherStatus({ type: "success", message: `Teacher created: ${data.name}` });
      setTeacher({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      await loadDashboard();
      setStudent((current) => ({ ...current, assignedTeacher: data._id }));
    } catch (error) {
      setTeacherStatus({
        type: "error",
        message: extractErrorMessage(error, "Unable to create teacher."),
      });
    } finally {
      setTeacherSubmitting(false);
    }
  };

  const handleStudentSubmit = async (event) => {
    event.preventDefault();

    setStudentSubmitting(true);
    setStudentStatus({ type: "", message: "" });

    try {
      const payload = {
        ...student,
        dateOfBirth: student.dateOfBirth || undefined,
        profileImage: student.profileImage || undefined,
        assignedTeacher: student.assignedTeacher || undefined,
      };

      const { data } = await API.post("/admin/student", payload);
      setLatestStudent(data);
      setStudentStatus({ type: "success", message: `Student created: ${data.name}` });
      setStudent((current) => ({
        ...current,
        name: "",
        rollNumber: "",
        dateOfBirth: "",
        gender: "",
        phoneNumber: "",
        academicYear: "",
        className: "",
        section: "",
        profileImage: "",
      }));
      await loadDashboard(studentFilters);
      setActiveTab("students");
    } catch (error) {
      setStudentStatus({
        type: "error",
        message: extractErrorMessage(error, "Unable to create student."),
      });
    } finally {
      setStudentSubmitting(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoProcessing(true);
    setStudentStatus({ type: "", message: "" });

    try {
      const prepared = await prepareProfileImage(file);
      setStudent((current) => ({ ...current, profileImage: prepared }));
    } catch (error) {
      setStudentStatus({ type: "error", message: error.message });
    } finally {
      setPhotoProcessing(false);
      event.target.value = "";
    }
  };

  const applyStudentFilters = async () => {
    await loadDashboard(studentFilters);
  };

  const clearStudentFilters = async () => {
    const cleared = { academicYear: "", className: "", section: "" };
    setStudentFilters(cleared);
    await loadDashboard(cleared);
  };

  const hero = (
    <section className="rounded-[32px] border border-app bg-panel p-6 shadow-[0_30px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-semibold text-app">Admin dashboard</h1>
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-slate-950 text-white"
                  : "border border-app bg-card text-app hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <DashboardLayout hero={hero}>
      <StatusToast
        message={teacherStatus.message}
        type={teacherStatus.type || "info"}
        onClose={() => setTeacherStatus({ type: "", message: "" })}
      />
      <StatusToast
        message={studentStatus.message}
        type={studentStatus.type || "info"}
        onClose={() => setStudentStatus({ type: "", message: "" })}
      />

      {status.error ? (
        <div className="mb-6 rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {status.error}
        </div>
      ) : null}

      {status.loading ? (
        <div className="rounded-[28px] border border-app bg-card p-8 text-sm text-app-secondary shadow-sm">
          Loading dashboard...
        </div>
      ) : null}

      {!status.loading && activeTab === "overview" ? (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Teachers", overview.teacherCount],
              ["Students", overview.studentCount],
              ["Classes", overview.classroomSummary.length],
              ["QR Ready", students.filter((item) => item.qrCode).length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[28px] border border-app bg-card p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-secondary">
                  {label}
                </p>
                <p className="mt-4 text-3xl font-semibold text-app">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!status.loading && activeTab === "teachers" ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[28px] border border-app bg-card p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-app">Create teacher</h2>

            <form className="mt-6 grid gap-4" onSubmit={handleTeacherSubmit}>
              {[
                ["name", "Name", '"John Doe"', "text"],
                ["email", "Email", '"john@example.com"', "email"],
              ].map(([key, label, placeholder, type]) => (
                <label key={key} className="grid gap-2 text-sm font-medium text-app">
                  <span>{label}</span>
                  <input
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={teacher[key]}
                    onChange={(event) =>
                      setTeacher((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    placeholder={placeholder}
                    type={type}
                    required
                  />
                </label>
              ))}

              <label className="grid gap-2 text-sm font-medium text-app">
                <span>Password</span>
                <div className="flex rounded-2xl border border-app bg-card focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
                  <input
                    className="min-w-0 flex-1 rounded-l-2xl bg-transparent px-4 py-3 text-app outline-none"
                    value={teacher.password}
                    onChange={(event) =>
                      setTeacher((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Create password"
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="rounded-r-2xl border-l border-app px-4 text-sm font-semibold text-app"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="grid gap-2 text-sm font-medium text-app">
                <span>Rewrite Password</span>
                <div className="flex rounded-2xl border border-app bg-card focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
                  <input
                    className="min-w-0 flex-1 rounded-l-2xl bg-transparent px-4 py-3 text-app outline-none"
                    value={teacher.confirmPassword}
                    onChange={(event) =>
                      setTeacher((current) => ({
                        ...current,
                        confirmPassword: event.target.value,
                      }))
                    }
                    placeholder='Rewrite Password "Admin@123"'
                    type={showPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="rounded-r-2xl border-l border-app px-4 text-sm font-semibold text-app"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {teacher.password ? (
                <p className={`text-xs ${passwordError ? "text-rose-600" : "text-emerald-600"}`}>
                  {passwordError || "Password looks good."}
                </p>
              ) : null}

              {teacher.confirmPassword ? (
                <p className={`text-xs ${confirmPasswordError ? "text-rose-600" : "text-emerald-600"}`}>
                  {confirmPasswordError || "Passwords match."}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={teacherSubmitting}
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {teacherSubmitting ? "Creating..." : "Create Teacher"}
              </button>
            </form>
          </section>

          <section className="rounded-[28px] border border-app bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-app">Teacher directory</h2>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-app-secondary">
                {teachers.length}
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {teachers.length === 0 ? (
                <p className="text-sm text-app-secondary">No teachers found.</p>
              ) : (
                teachers.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex flex-col gap-4 rounded-2xl border border-app bg-muted p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-app">{entry.name}</p>
                      <p className="text-sm text-app-secondary">{entry.email}</p>
                      <p className="break-all text-xs text-app-secondary">{entry._id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStudent((current) => ({ ...current, assignedTeacher: entry._id }));
                        setActiveTab("students");
                      }}
                      className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      Use In Student Form
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      {!status.loading && activeTab === "students" ? (
        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[28px] border border-app bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-app">Create student</h2>

            <form className="mt-6 grid gap-4" onSubmit={handleStudentSubmit}>
              <label className="grid gap-2 text-sm font-medium text-app">
                <span>Name</span>
                <input
                  className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  value={student.name}
                  onChange={(event) =>
                    setStudent((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder='"John Doe"'
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Roll Number</span>
                  <input
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={student.rollNumber}
                    onChange={(event) =>
                      setStudent((current) => ({
                        ...current,
                        rollNumber: event.target.value,
                      }))
                    }
                    placeholder='"12"'
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Date Of Birth</span>
                  <input
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    type="date"
                    value={student.dateOfBirth}
                    onChange={(event) =>
                      setStudent((current) => ({
                        ...current,
                        dateOfBirth: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Gender</span>
                  <select
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={student.gender}
                    onChange={(event) =>
                      setStudent((current) => ({ ...current, gender: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select gender</option>
                    {["Male", "Female", "Other"].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Academic Year</span>
                  <select
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={student.academicYear}
                    onChange={(event) =>
                      setStudent((current) => ({ ...current, academicYear: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select academic year</option>
                    {academicYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Phone Number</span>
                  <input
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={student.phoneNumber}
                    onChange={(event) =>
                      setStudent((current) => ({ ...current, phoneNumber: event.target.value }))
                    }
                    placeholder='"9876543210"'
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Class</span>
                  <select
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={student.className}
                    onChange={(event) =>
                      setStudent((current) => ({ ...current, className: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select class</option>
                    {classOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Section</span>
                  <select
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={student.section}
                    onChange={(event) =>
                      setStudent((current) => ({ ...current, section: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select section</option>
                    {sectionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium text-app">
                <span>Assigned Teacher</span>
                <select
                  className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  value={student.assignedTeacher}
                    onChange={(event) =>
                      setStudent((current) => ({
                        ...current,
                        assignedTeacher: event.target.value,
                      }))
                    }
                    required
                  >
                  <option value="">Select teacher</option>
                  {teachers.map((entry) => (
                    <option key={entry._id} value={entry._id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-app">
                <span>Profile Photo</span>
                <input
                  className="rounded-2xl border border-app bg-card px-4 py-3 text-app outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-semibold file:text-app focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handlePhotoChange}
                />
              </label>

              {photoProcessing ? <p className="text-xs text-app-secondary">Preparing photo...</p> : null}

              {student.profileImage ? (
                <img
                  src={student.profileImage}
                  alt="Student preview"
                  className="h-20 w-20 rounded-2xl border border-app object-cover"
                />
              ) : null}

              <button
                type="submit"
                disabled={studentSubmitting}
                className="rounded-full bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
              >
                {studentSubmitting ? "Creating..." : "Create Student"}
              </button>
            </form>

            {latestStudent ? (
              <div className="mt-6 rounded-[24px] border border-cyan-200 bg-cyan-50/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{latestStudent.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">Roll Number: {latestStudent.rollNumber}</p>
                  </div>
                  <DownloadQR
                    qrCode={latestStudent.qrCode}
                    fileName={`${latestStudent.rollNumber || "student"}-qr.png`}
                  />
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-app bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-app">Student directory</h2>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-app-secondary">
                  {students.length}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Academic Year</span>
                  <select
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-sm text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={studentFilters.academicYear}
                    onChange={(event) =>
                      setStudentFilters((current) => ({
                        ...current,
                        academicYear: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select academic year</option>
                    {academicYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Class</span>
                  <select
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-sm text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={studentFilters.className}
                    onChange={(event) =>
                      setStudentFilters((current) => ({
                        ...current,
                        className: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select class</option>
                    {classOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Section</span>
                  <select
                    className="rounded-2xl border border-app bg-card px-4 py-3 text-sm text-app outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={studentFilters.section}
                    onChange={(event) =>
                      setStudentFilters((current) => ({
                        ...current,
                        section: event.target.value,
                      }))
                    }
                  >
                    <option value="">All sections</option>
                    {sectionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={applyStudentFilters}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={clearStudentFilters}
                  className="rounded-full border border-app px-4 py-2 text-sm font-semibold text-app transition hover:bg-muted"
                >
                  Clear
                </button>
              </div>
            </div>

            {!studentFilters.className ? (
              <div className="mt-6 rounded-2xl border border-app bg-muted p-5 text-sm text-app-secondary">
                Select a class to view students.
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-2">
                  {paginatedStudents.length === 0 ? (
                    <p className="text-sm text-app-secondary">No students found.</p>
                  ) : (
                    paginatedStudents.map((entry) => (
                      <div
                        key={entry._id}
                        className="flex flex-col gap-2 rounded-2xl border border-app bg-muted p-3 text-xs sm:text-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold text-app">{entry.name}</p>
                            <p className="text-app-secondary">
                              Roll {entry.rollNumber || "-"} • {entry.className || "-"} / {entry.section || "-"}
                            </p>
                            <p className="text-app-secondary">
                              {entry.assignedTeacher?.name || "No teacher assigned"}
                            </p>
                          </div>
                            <DownloadQR
                              qrCode={entry.qrCode}
                              fileName={`${entry.rollNumber || entry._id}-qr.png`}
                            />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Pagination
                  page={studentPage}
                  totalPages={totalStudentPages}
                  onPageChange={setStudentPage}
                />
              </>
            )}
          </section>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
