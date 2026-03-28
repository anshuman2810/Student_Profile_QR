import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import API, { extractErrorMessage } from "../api/axios";
import AcademicYearEditor from "../components/AcademicYearEditor";
import StatusToast from "../components/StatusToast";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function AddAcademicYear() {
  const { studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState({
    loading: false,
    error: "",
  });

  const studentName = location.state?.student?.name;

  const submit = async (form) => {
    setStatus({ loading: true, error: "" });

    try {
      await API.post(`/teacher/add-year/${studentId}`, form);
      navigate(`/teacher/students/${studentId}`, {
        replace: true,
        state: location.state,
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: extractErrorMessage(error, "Unable to add academic year."),
      });
    }
  };

  return (
    <DashboardLayout
      hero={
        <section className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.1)] backdrop-blur">
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            {studentName ? `Create a new record for ${studentName}` : "Create a new year record"}
          </h1>
        </section>
      }
    >
      <StatusToast
        message={status.error}
        type="error"
        onClose={() => setStatus((current) => ({ ...current, error: "" }))}
      />

      <AcademicYearEditor
        title="Academic Year Details"
        description=""
        initialValue={null}
        submitLabel="Save Academic Year"
        loading={status.loading}
        onSubmit={submit}
      />

      <div className="mt-6">
        <Link
          to={`/teacher/students/${studentId}`}
          state={location.state}
          className="text-sm font-medium text-cyan-700 underline-offset-4 hover:underline"
        >
          Back to student record
        </Link>
      </div>
    </DashboardLayout>
  );
}
