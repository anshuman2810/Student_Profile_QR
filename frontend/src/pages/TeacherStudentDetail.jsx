import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import API, { extractErrorMessage } from "../api/axios";
import StatusToast from "../components/StatusToast";
import DashboardLayout from "../components/layout/DashboardLayout";
import { prepareProfileImage } from "../utils/image";

export default function TeacherStudentDetail() {
  const { studentId } = useParams();
  const location = useLocation();
  const [years, setYears] = useState([]);
  const [student, setStudent] = useState(location.state?.student || null);
  const [status, setStatus] = useState({
    loading: true,
    error: "",
  });
  const [imageStatus, setImageStatus] = useState({
    loading: false,
    message: "",
    type: "",
  });

  useEffect(() => {
    const loadStudentContext = async () => {
      setStatus({ loading: true, error: "" });

      try {
        const [yearsResponse, studentResponse] = await Promise.all([
          API.get(`/student/${studentId}/years`),
          API.get(`/teacher/student/${studentId}`),
        ]);

        setYears(yearsResponse.data);
        setStudent(studentResponse.data);
        setStatus({ loading: false, error: "" });
      } catch (error) {
        setStatus({
          loading: false,
          error: extractErrorMessage(error, "Unable to load student details."),
        });
      }
    };

    loadStudentContext();
  }, [studentId]);

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageStatus({ loading: true, message: "", type: "" });

    try {
      const profileImage = await prepareProfileImage(file);
      const response = await API.put(`/teacher/student/${studentId}/profile-image`, {
        profileImage,
      });

      setStudent(response.data);
      setImageStatus({
        loading: false,
        message: "Profile photo updated.",
        type: "success",
      });
    } catch (error) {
      setImageStatus({
        loading: false,
        message: extractErrorMessage(error, "Unable to update profile photo."),
        type: "error",
      });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <DashboardLayout
      hero={
        <section className="rounded-[32px] border border-white/60 bg-white/75 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8">
          <h1 className="text-3xl font-semibold text-slate-950">
            {student?.name || "Student record"}
          </h1>
        </section>
      }
    >
      <StatusToast
        message={imageStatus.message}
        type={imageStatus.type || "info"}
        onClose={() => setImageStatus({ loading: false, message: "", type: "" })}
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start gap-5">
            {student?.profileImage ? (
              <img
                src={student.profileImage}
                alt={student.name}
                className="h-36 w-36 rounded-[28px] object-cover ring-4 ring-slate-100"
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-[28px] bg-slate-100 text-4xl font-semibold text-slate-500">
                {student?.name?.charAt(0) || "S"}
              </div>
            )}

            <div className="w-full">
              <h2 className="text-2xl font-semibold text-slate-950">{student?.name}</h2>
              <p className="mt-2 text-sm text-slate-600">Roll Number: {student?.rollNumber || "-"}</p>
              <p className="mt-1 text-sm text-slate-600">Phone: {student?.phoneNumber || "-"}</p>
              <p className="mt-1 text-sm text-slate-600">
                {student?.className || "Unassigned"} / {student?.section || "No Section"}
              </p>
            </div>

            <label className="grid w-full gap-2 text-sm font-medium text-slate-700">
              <span>Update Profile Photo</span>
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handlePhotoChange}
              />
            </label>

            <Link
              to={`/teacher/students/${studentId}/add-year`}
              state={{ student }}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add Academic Year
            </Link>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Academic Years</h2>
              <p className="mt-2 text-sm text-slate-600 break-all">Student ID: {studentId}</p>
            </div>
          </div>

          {status.error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {status.error}
            </div>
          ) : null}

          {status.loading ? (
            <p className="mt-6 text-sm text-slate-600">Loading academic years...</p>
          ) : null}

          {!status.loading && !status.error ? (
            years.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-7 text-slate-600">
                No academic years found yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {years.map((year) => (
                  <div
                    key={year}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{year}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/teacher/students/${studentId}/years/${encodeURIComponent(year)}/edit`}
                        state={{ student }}
                        className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/student/${studentId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        Preview
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  );
}
