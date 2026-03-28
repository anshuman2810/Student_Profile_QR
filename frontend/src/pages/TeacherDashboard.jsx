import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API, { extractErrorMessage } from "../api/axios";
import DownloadQR from "../components/DownloadQR";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatusToast from "../components/StatusToast";
import { prepareProfileImage } from "../utils/image";
import { addAcademicYearOption, getAcademicYearOptions } from "../utils/academicYears";
import { classOptions, sectionOptions } from "../utils/classroomOptions";

const tabs = [
  { id: "students", label: "Students" },
  { id: "attendance", label: "Attendance" },
  { id: "profile", label: "My Profile" },
];

const studentPageSize = 8;

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [filters, setFilters] = useState({
    academicYear: "",
    className: "",
    section: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    academicYear: "",
    className: "",
    section: "",
  });
  const [studentForm, setStudentForm] = useState({
    name: "",
    rollNumber: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    academicYear: "",
    className: "",
    section: "",
    profileImage: "",
  });
  const [attendanceForm, setAttendanceForm] = useState({
    academicYear: "",
    date: new Date().toISOString().slice(0, 10),
    isHoliday: false,
    presentStudentIds: [],
  });
  const [status, setStatus] = useState({
    loading: true,
    error: "",
  });
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });
  const [attendanceStatus, setAttendanceStatus] = useState({ type: "", message: "" });
  const [yearManager, setYearManager] = useState({
    value: "",
    message: "",
    type: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [profilePhotoProcessing, setProfilePhotoProcessing] = useState(false);
  const [studentPage, setStudentPage] = useState(1);

  const loadStudents = async (nextFilters = appliedFilters) => {
    setStatus({ loading: true, error: "" });

    try {
      const [studentsResponse, classroomsResponse, profileResponse] = await Promise.all([
        API.get("/teacher/students", {
          params: {
            academicYear: nextFilters.academicYear || undefined,
            className: nextFilters.className || undefined,
            section: nextFilters.section || undefined,
          },
        }),
        API.get("/teacher/classrooms", {
          params: {
            academicYear: nextFilters.academicYear || undefined,
          },
        }),
        API.get("/teacher/profile"),
      ]);

      setStudents(studentsResponse.data);
      setClassrooms(classroomsResponse.data);
      setTeacherProfile(profileResponse.data);
      setStudentPage(1);
      setAppliedFilters(nextFilters);
      setAttendanceForm((current) => ({
        ...current,
        academicYear: nextFilters.academicYear || current.academicYear,
        presentStudentIds: current.presentStudentIds.filter((id) =>
          studentsResponse.data.some((student) => student._id === id),
        ),
      }));
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({
        loading: false,
        error: extractErrorMessage(error, "Unable to load teacher dashboard."),
      });
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setStatus({ loading: true, error: "" });

      try {
        const [studentsResponse, classroomsResponse, profileResponse] = await Promise.all([
          API.get("/teacher/students"),
          API.get("/teacher/classrooms"),
          API.get("/teacher/profile"),
        ]);

        setStudents(studentsResponse.data);
        setClassrooms(classroomsResponse.data);
        setTeacherProfile(profileResponse.data);
        setAppliedFilters({
          academicYear: "",
          className: "",
          section: "",
        });
        setStatus({ loading: false, error: "" });
      } catch (error) {
        setStatus({
          loading: false,
          error: extractErrorMessage(error, "Unable to load teacher dashboard."),
        });
      }
    };

    initializeDashboard();
  }, []);

  const visibleStudentIds = useMemo(
    () => students.map((student) => student._id),
    [students],
  );
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * studentPageSize;
    return students.slice(start, start + studentPageSize);
  }, [studentPage, students]);
  const totalStudentPages = Math.max(1, Math.ceil(students.length / studentPageSize));
  const [academicYearOptions, setAcademicYearOptions] = useState(() => getAcademicYearOptions());

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoProcessing(true);
    setFormStatus({ type: "", message: "" });

    try {
      const prepared = await prepareProfileImage(file);
      setStudentForm((current) => ({
        ...current,
        profileImage: prepared,
      }));
    } catch (error) {
      setFormStatus({
        type: "error",
        message: error.message,
      });
    } finally {
      setPhotoProcessing(false);
      event.target.value = "";
    }
  };

  const handleTeacherPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfilePhotoProcessing(true);
    setProfileStatus({ type: "", message: "" });

    try {
      const profileImage = await prepareProfileImage(file);
      const response = await API.put("/teacher/profile-image", { profileImage });
      setTeacherProfile(response.data);
      setProfileStatus({
        type: "success",
        message: "Profile photo updated.",
      });
    } catch (error) {
      setProfileStatus({
        type: "error",
        message: extractErrorMessage(error, "Unable to update profile photo."),
      });
    } finally {
      setProfilePhotoProcessing(false);
      event.target.value = "";
    }
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormStatus({ type: "", message: "" });

    try {
      await API.post("/teacher/student", {
        ...studentForm,
        dateOfBirth: studentForm.dateOfBirth || undefined,
        profileImage: studentForm.profileImage || undefined,
      });
      setFormStatus({ type: "success", message: "Student added." });
      setStudentForm({
        name: "",
        rollNumber: "",
        dateOfBirth: "",
        gender: "",
        phoneNumber: "",
        academicYear: "",
        className: "",
        section: "",
        profileImage: "",
      });
      await loadStudents();
    } catch (error) {
      setFormStatus({
        type: "error",
        message: extractErrorMessage(error, "Unable to add student."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAcademicYearOption = () => {
    try {
      const nextYears = addAcademicYearOption(yearManager.value);
      setAcademicYearOptions(nextYears);
      setYearManager({
        value: "",
        type: "success",
        message: "Academic year added.",
      });
    } catch (error) {
      setYearManager((current) => ({
        ...current,
        type: "error",
        message: error.message,
      }));
    }
  };

  const handleDeleteStudent = async (studentId) => {
    const confirmed = window.confirm("Remove this student?");
    if (!confirmed) return;

    try {
      await API.delete(`/teacher/student/${studentId}`);
      setFormStatus({ type: "success", message: "Student removed." });
      await loadStudents();
    } catch (error) {
      setFormStatus({
        type: "error",
        message: extractErrorMessage(error, "Unable to remove student."),
      });
    }
  };

  const togglePresentSelection = (studentId) => {
    setAttendanceForm((current) => ({
      ...current,
      presentStudentIds: current.presentStudentIds.includes(studentId)
        ? current.presentStudentIds.filter((id) => id !== studentId)
        : [...current.presentStudentIds, studentId],
    }));
  };

  const handleAttendanceSubmit = async (event) => {
    event.preventDefault();
    setAttendanceSubmitting(true);
    setAttendanceStatus({ type: "", message: "" });

    try {
      await API.post("/teacher/attendance/bulk", {
        academicYear: attendanceForm.academicYear,
        date: attendanceForm.date,
        isHoliday: attendanceForm.isHoliday,
        targetStudentIds: visibleStudentIds,
        presentStudentIds: attendanceForm.isHoliday ? [] : attendanceForm.presentStudentIds,
      });

      setAttendanceStatus({
        type: "success",
        message: attendanceForm.isHoliday
          ? "Holiday marked for selected students."
          : "Attendance saved.",
      });
      await loadStudents();
    } catch (error) {
      setAttendanceStatus({
        type: "error",
        message: extractErrorMessage(error, "Unable to save attendance."),
      });
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const hero = (
    <section className="rounded-[32px] border border-app bg-panel p-6 shadow-[0_30px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-semibold text-app">Teacher dashboard</h1>
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
        message={formStatus.message}
        type={formStatus.type || "info"}
        onClose={() => setFormStatus({ type: "", message: "" })}
      />
      <StatusToast
        message={profileStatus.message}
        type={profileStatus.type || "info"}
        onClose={() => setProfileStatus({ type: "", message: "" })}
      />
      <StatusToast
        message={attendanceStatus.message}
        type={attendanceStatus.type || "info"}
        onClose={() => setAttendanceStatus({ type: "", message: "" })}
      />
      <StatusToast
        message={yearManager.message}
        type={yearManager.type || "info"}
        onClose={() => setYearManager((current) => ({ ...current, message: "", type: "" }))}
      />

      {status.error ? (
        <div className="mb-6 rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
          {status.error}
        </div>
      ) : null}

      {status.loading ? (
        <div className="rounded-[28px] border border-app bg-card p-8 text-sm text-app-secondary shadow-sm">
          Loading dashboard...
        </div>
      ) : null}

      {!status.loading && activeTab === "profile" ? (
        <section className="mx-auto max-w-3xl rounded-[28px] border border-app bg-card p-6 shadow-sm">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {teacherProfile?.profileImage ? (
              <img
                src={teacherProfile.profileImage}
                alt={teacherProfile.name}
                className="h-28 w-28 rounded-[28px] object-cover ring-4 ring-slate-100"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-[28px] bg-muted text-3xl font-semibold text-app-secondary">
                {teacherProfile?.name?.charAt(0) || "T"}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-app">{teacherProfile?.name}</h2>
              <p className="mt-1 text-sm text-app-secondary">{teacherProfile?.email}</p>
              <p className="mt-1 text-sm text-app-secondary capitalize">{teacherProfile?.role}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-app">
              <span>Update Profile Photo</span>
              <input
                className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-semibold file:text-app-secondary focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleTeacherPhotoChange}
              />
            </label>

            {profilePhotoProcessing ? (
              <p className="text-xs text-app-secondary">Uploading photo...</p>
            ) : null}

          </div>
        </section>
      ) : null}

      {!status.loading && activeTab === "attendance" ? (
        <section className="grid gap-6">
          <div className="rounded-[28px] border border-app bg-card p-6 shadow-sm">
            <form className="grid gap-5" onSubmit={handleAttendanceSubmit}>
              <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_auto]">
                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Academic Year</span>
                  <select
                    className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={attendanceForm.academicYear}
                    onChange={(event) => {
                      setFilters((current) => ({
                        ...current,
                        academicYear: event.target.value,
                        className: current.academicYear === event.target.value ? current.className : "",
                        section: current.academicYear === event.target.value ? current.section : "",
                      }));
                      setAttendanceForm((current) => ({
                        ...current,
                        academicYear: event.target.value,
                        presentStudentIds: [],
                      }));
                    }}
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
                  <span>Class</span>
                  <select
                    className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={filters.className}
                    onChange={(event) => {
                      setFilters((current) => ({
                        ...current,
                        className: event.target.value,
                      }));
                      setAttendanceForm((current) => ({
                        ...current,
                        presentStudentIds: [],
                      }));
                    }}
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
                    className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={filters.section}
                    onChange={(event) => {
                      setFilters((current) => ({
                        ...current,
                        section: event.target.value,
                      }));
                      setAttendanceForm((current) => ({
                        ...current,
                        presentStudentIds: [],
                      }));
                    }}
                  >
                    <option value="">All sections</option>
                    {sectionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium text-app">
                  <span>Date</span>
                  <input
                    className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    type="date"
                    value={attendanceForm.date}
                    onChange={(event) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="flex items-end gap-3 text-sm font-medium text-app">
                  <input
                    type="checkbox"
                    checked={attendanceForm.isHoliday}
                    onChange={(event) =>
                      setAttendanceForm((current) => ({
                        ...current,
                        isHoliday: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded border-app"
                  />
                  <span>Declare holiday</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => loadStudents(filters)}
                  disabled={!filters.academicYear || !filters.className}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Apply Filter
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAttendanceForm((current) => ({
                      ...current,
                      presentStudentIds: [...visibleStudentIds],
                    }))
                  }
                  disabled={attendanceForm.isHoliday}
                  className="rounded-full border border-app bg-card px-4 py-2 text-sm font-semibold text-app transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setAttendanceForm((current) => ({
                      ...current,
                      presentStudentIds: [],
                    }))
                  }
                  disabled={attendanceForm.isHoliday}
                  className="rounded-full border border-app bg-card px-4 py-2 text-sm font-semibold text-app transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Deselect All
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {students.map((student) => {
                  const checked = attendanceForm.presentStudentIds.includes(student._id);

                  return (
                    <label
                      key={student._id}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-app bg-muted px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-app">{student.name}</p>
                        <p className="text-sm text-app-secondary">
                          {student.className || "Unassigned"} / {student.section || "No Section"}
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={attendanceForm.isHoliday ? false : checked}
                        disabled={attendanceForm.isHoliday}
                        onChange={() => togglePresentSelection(student._id)}
                        className="mt-1 h-5 w-5 rounded border-app"
                      />
                    </label>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={
                  attendanceSubmitting ||
                  students.length === 0 ||
                  !appliedFilters.academicYear ||
                  !appliedFilters.className
                }
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {attendanceSubmitting ? "Saving..." : "Save Attendance"}
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {!status.loading && activeTab === "students" ? (
        <>
          <div className="mb-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[28px] border border-app bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-app">Student directory</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-sm font-medium text-app">
                    <span>Academic Year</span>
                    <select
                      className="rounded-2xl border border-app bg-card px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      value={filters.academicYear}
                      onChange={(event) => {
                        setFilters({
                          academicYear: event.target.value,
                          className: "",
                          section: "",
                        });
                        setAttendanceForm((current) => ({
                          ...current,
                          academicYear: event.target.value,
                          presentStudentIds: [],
                        }));
                      }}
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
                      className="rounded-2xl border border-app bg-card px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={filters.className}
                    onChange={(event) => {
                        setFilters((current) => ({
                          ...current,
                          className: event.target.value,
                        }));
                      }}
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
                      className="rounded-2xl border border-app bg-card px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    value={filters.section}
                    onChange={(event) => {
                        setFilters((current) => ({
                          ...current,
                          section: event.target.value,
                        }));
                      }}
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

                <div className="rounded-2xl border border-app bg-muted p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <label className="grid flex-1 gap-2 text-sm font-medium text-app">
                      <span>Add Academic Year</span>
                      <input
                        className="rounded-2xl border border-app bg-card px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        value={yearManager.value}
                        onChange={(event) =>
                          setYearManager((current) => ({
                            ...current,
                            value: event.target.value,
                            message: "",
                            type: "",
                          }))
                        }
                        placeholder='"2026-27"'
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleAddAcademicYearOption}
                      className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Add Academic Year
                    </button>
                  </div>

                </div>

                {filters.academicYear && classrooms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {classrooms.map((room) => (
                      <span
                        key={`${room.className}-${room.section}`}
                        className="rounded-full border border-app bg-muted px-3 py-1 text-xs font-semibold text-app-secondary"
                      >
                        {room.className} / {room.section} • {room.count}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => loadStudents(filters)}
                    disabled={!filters.academicYear || !filters.className}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cleared = {
                        academicYear: "",
                        className: "",
                        section: "",
                      };
                      setFilters(cleared);
                      setAttendanceForm((current) => ({
                        ...current,
                        academicYear: "",
                        presentStudentIds: [],
                      }));
                      loadStudents(cleared);
                    }}
                    className="rounded-full border border-app bg-card px-4 py-2 text-sm font-semibold text-app transition hover:bg-muted"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-app bg-card p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-app">Add Student</h2>
              <form className="mt-6 grid gap-4" onSubmit={handleCreateStudent}>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ["name", "Name", '"John Doe"'],
                    ["rollNumber", "Roll Number", '"12"'],
                  ].map(([key, label, placeholder]) => (
                    <label key={key} className="grid gap-2 text-sm font-medium text-app">
                      <span>{label}</span>
                      <input
                        className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        value={studentForm[key]}
                        onChange={(event) =>
                          setStudentForm((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        placeholder={placeholder}
                        required={key === "name" || key === "rollNumber"}
                      />
                    </label>
                  ))}

                  <label className="grid gap-2 text-sm font-medium text-app">
                    <span>Gender</span>
                    <select
                      className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      value={studentForm.gender}
                    onChange={(event) =>
                      setStudentForm((current) => ({
                          ...current,
                          gender: event.target.value,
                        }))
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
                      className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      value={studentForm.academicYear}
                      onChange={(event) =>
                        setStudentForm((current) => ({
                          ...current,
                          academicYear: event.target.value,
                        }))
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
                      className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      value={studentForm.phoneNumber}
                      onChange={(event) =>
                        setStudentForm((current) => ({
                          ...current,
                          phoneNumber: event.target.value,
                        }))
                      }
                      placeholder='"9876543210"'
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-app">
                    <span>Class</span>
                    <select
                      className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      value={studentForm.className}
                      onChange={(event) =>
                        setStudentForm((current) => ({
                          ...current,
                          className: event.target.value,
                        }))
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
                      className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      value={studentForm.section}
                      onChange={(event) =>
                        setStudentForm((current) => ({
                          ...current,
                          section: event.target.value,
                        }))
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

                  <label className="grid gap-2 text-sm font-medium text-app">
                    <span>Date Of Birth</span>
                    <input
                      className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      type="date"
                      value={studentForm.dateOfBirth}
                      onChange={(event) =>
                        setStudentForm((current) => ({
                          ...current,
                          dateOfBirth: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-app md:col-span-2">
                    <span>Profile Photo</span>
                    <input
                      className="rounded-2xl border border-app bg-card px-4 py-3 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-muted file:px-4 file:py-2 file:text-sm file:font-semibold file:text-app-secondary focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>

                {photoProcessing ? <p className="text-xs text-app-secondary">Preparing photo...</p> : null}

                {studentForm.profileImage ? (
                  <img
                    src={studentForm.profileImage}
                    alt="Student preview"
                    className="h-20 w-20 rounded-2xl border border-app object-cover"
                  />
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {submitting ? "Saving..." : "Add Student"}
                </button>
              </form>
            </section>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {!appliedFilters.className ? (
              <div className="rounded-[28px] border border-app bg-card p-8 text-sm leading-7 text-app-secondary shadow-sm">
                Select academic year and class to view students.
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-[28px] border border-app bg-card p-8 text-sm leading-7 text-app-secondary shadow-sm">
                No students found for the current selection.
              </div>
            ) : (
              paginatedStudents.map((student) => (
                <article
                  key={student._id}
                  className="rounded-[24px] border border-app bg-card p-4 text-xs shadow-sm sm:text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-300">
                        Student
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-app">{student.name}</h2>
                      <p className="mt-1 text-app-secondary">
                        Roll Number: {student.rollNumber}
                      </p>
                      <p className="mt-1 text-app-secondary">
                        {student.className || "Unassigned"} / {student.section || "No Section"}
                      </p>
                    </div>

                    <DownloadQR
                      qrCode={student.qrCode}
                      fileName={`${student.rollNumber || student._id}-qr.png`}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/teacher/students/${student._id}`}
                      state={{ student }}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Manage Record
                    </Link>

                    <Link
                      to={`/student/${student._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-app bg-card px-4 py-2 text-sm font-semibold text-app transition hover:bg-muted"
                    >
                      Open Public Profile
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteStudent(student._id)}
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                    >
                      Remove Student
                    </button>
                  </div>

                </article>
              ))
            )}
          </div>
          {appliedFilters.className && students.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-app-secondary">
              <span>
                Page {studentPage} of {totalStudentPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStudentPage((current) => Math.max(1, current - 1))}
                  disabled={studentPage === 1}
                  className="rounded-full border border-app bg-card px-4 py-2 font-semibold text-app transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStudentPage((current) => Math.min(totalStudentPages, current + 1))
                  }
                  disabled={studentPage === totalStudentPages}
                  className="rounded-full border border-app bg-card px-4 py-2 font-semibold text-app transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </DashboardLayout>
  );
}
