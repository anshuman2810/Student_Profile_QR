import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import API, { extractErrorMessage } from "../api/axios";
import AcademicYearEditor from "../components/AcademicYearEditor";
import StatusToast from "../components/StatusToast";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function EditAcademicYear() {
  const { studentId, year } = useParams();
  const decodedYear = decodeURIComponent(year);
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({
    loading: true,
    saving: false,
    error: "",
  });

  useEffect(() => {
    const loadRecord = async () => {
      setStatus({ loading: true, saving: false, error: "" });

      try {
        const response = await API.get(
          `/student/${studentId}/year/${encodeURIComponent(decodedYear)}`,
        );
        setForm(response.data.academicYear);
        setStatus({ loading: false, saving: false, error: "" });
      } catch (error) {
        setStatus({
          loading: false,
          saving: false,
          error: extractErrorMessage(error, "Unable to load the academic year."),
        });
      }
    };

    loadRecord();
  }, [decodedYear, studentId]);

  const update = async (payload) => {
    setStatus((current) => ({ ...current, saving: true, error: "" }));

    try {
      await API.put(`/teacher/update-year/${studentId}`, payload);
      navigate(`/teacher/students/${studentId}`, {
        replace: true,
        state: location.state,
      });
    } catch (error) {
      setStatus((current) => ({
        ...current,
        saving: false,
        error: extractErrorMessage(error, "Unable to update the academic year."),
      }));
    }
  };

  return (
    <DashboardLayout
      hero={
        <section className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.1)] backdrop-blur">
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Update the {decodedYear} record
          </h1>
        </section>
      }
    >
      <StatusToast
        message={status.error}
        type="error"
        onClose={() => setStatus((current) => ({ ...current, error: "" }))}
      />

      {status.loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          Loading academic year details...
        </div>
      ) : (
        <AcademicYearEditor
          title={`Editing ${decodedYear}`}
          description=""
          initialValue={form}
          submitLabel="Update Academic Year"
          loading={status.saving}
          onSubmit={update}
        />
      )}

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
