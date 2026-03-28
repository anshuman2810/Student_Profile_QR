import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API, { extractErrorMessage } from "../api/axios";
import DownloadQR from "../components/DownloadQR";

export default function StudentProfile() {
  const { id } = useParams();
  const [years, setYears] = useState([]);
  const [data, setData] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [status, setStatus] = useState({
    loading: true,
    error: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      setStatus({ loading: true, error: "" });

      try {
        const [yearsResponse, latestResponse] = await Promise.all([
          API.get(`/student/${id}/years`),
          API.get(`/student/${id}/latest`),
        ]);

        setYears(yearsResponse.data);
        setData(latestResponse.data);
        setSelectedYear(latestResponse.data.academicYear?.year || "");
        setStatus({ loading: false, error: "" });
      } catch (error) {
        setStatus({
          loading: false,
          error: extractErrorMessage(error, "Unable to load this student profile."),
        });
      }
    };

    loadProfile();
  }, [id]);

  const loadYear = async (year) => {
    setSelectedYear(year);
    setStatus((current) => ({ ...current, error: "" }));

    try {
      const response = await API.get(`/student/${id}/year/${encodeURIComponent(year)}`);
      setData(response.data);
    } catch (error) {
      setStatus((current) => ({
        ...current,
        error: extractErrorMessage(error, "Unable to load the selected academic year."),
      }));
    }
  };

  const downloadPdf = () => {
    window.print();
  };

  return (
    <div className="student-print-page min-h-screen bg-[linear-gradient(180deg,#082f49_0%,#164e63_18%,#f8fafc_18%,#e2e8f0_100%)] px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <section className="student-print-sheet rounded-[24px] border border-white/60 bg-white p-3 text-slate-900 shadow-[0_24px_70px_rgba(8,47,73,0.18)] sm:p-4 lg:p-5">
          {status.loading ? (
            <p className="text-sm text-slate-600">Loading student profile...</p>
          ) : status.error && !data ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {status.error}
            </div>
          ) : data ? (
            <div className="grid gap-4">
              <section className="student-print-header rounded-[20px] bg-slate-950 p-4 text-white sm:p-5">
                <div className="student-print-header-grid grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="student-print-header-details min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
                      Student Profile
                    </p>
                    <h1 className="mt-2 break-words text-2xl font-semibold sm:text-3xl">
                      {data.name}
                    </h1>
                    <div className="mt-4 grid gap-2 text-sm text-cyan-100 sm:grid-cols-2 xl:grid-cols-3">
                      <p>Roll Number: {data.rollNumber || "-"}</p>
                      <p>Phone: {data.phoneNumber || "-"}</p>
                      <p>
                        Class: {data.className || data.academicYear?.className || "-"} /{" "}
                        {data.section || data.academicYear?.section || "-"}
                      </p>
                      <p className="sm:col-span-2 xl:col-span-3">
                        Verified by: {data.assignedTeacherName || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="student-print-header-media grid grid-cols-2 gap-3 self-start">
                    <div className="flex justify-center">
                      {data.profileImage ? (
                        <img
                          src={data.profileImage}
                          alt={data.name}
                          className="student-print-profile-image h-28 w-28 rounded-[20px] object-cover ring-4 ring-white/10 sm:h-32 sm:w-32"
                        />
                      ) : (
                        <div className="student-print-profile-image flex h-28 w-28 items-center justify-center rounded-[20px] bg-white/10 text-3xl font-semibold text-cyan-200 sm:h-32 sm:w-32">
                          {data.name?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center">
                      {data.qrCode ? (
                        <img
                          src={data.qrCode}
                          alt={`QR for ${data.name}`}
                          className="student-print-qr-image h-28 w-28 rounded-[20px] bg-white p-2 sm:h-32 sm:w-32"
                        />
                      ) : (
                        <div className="student-print-qr-image flex h-28 w-28 items-center justify-center rounded-[20px] bg-white/10 px-3 text-center text-[11px] text-cyan-100 sm:h-32 sm:w-32">
                          QR unavailable
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 print:hidden sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={downloadPdf}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Save PDF
                  </button>
                  <DownloadQR
                    qrCode={data.qrCode}
                    fileName={`${data.rollNumber || data._id}-qr.png`}
                  />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    ["Total Days", data.academicYear?.totalDays ?? 0],
                    ["Present Days", data.academicYear?.presentDays ?? 0],
                    ["Attendance %", `${data.academicYear?.attendancePercentage ?? 0}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-white/10 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/80">
                        {label}
                      </p>
                      <p className="mt-1 text-base font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid gap-4">
                <section className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-950">Academic Snapshot</h2>
                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                      <span>Academic Year</span>
                      <select
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                        value={selectedYear}
                        onChange={(event) => loadYear(event.target.value)}
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {[
                      ["Class", data.academicYear?.className || "-"],
                      ["Section", data.academicYear?.section || "-"],
                      [
                        "Attendance",
                        data.academicYear?.attendancePercentage !== undefined &&
                        data.academicYear?.attendancePercentage !== null
                          ? `${data.academicYear.attendancePercentage}%`
                          : "-",
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {status.error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {status.error}
                  </div>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
                  <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                    <h2 className="text-lg font-semibold text-slate-950">Test Reports</h2>
                    <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            {["Subject", "Test", "Total", "Received"].map((heading) => (
                              <th
                                key={heading}
                                className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                              >
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white text-xs text-slate-700 sm:text-sm">
                          {(data.academicYear?.testReports || []).length > 0 ? (
                            data.academicYear.testReports.map((report, index) => (
                              <tr key={`${report.testName}-${index}`}>
                                <td className="px-3 py-2">{report.subjectName || "-"}</td>
                                <td className="px-3 py-2">{report.testName || "-"}</td>
                                <td className="px-3 py-2">{report.totalMarks ?? "-"}</td>
                                <td className="px-3 py-2">{report.receivedMarks ?? "-"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="px-3 py-3 text-slate-500" colSpan="4">
                                No test reports recorded.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                    <h2 className="text-lg font-semibold text-slate-950">Co-curricular</h2>
                    <div className="mt-3 grid gap-2">
                      {(data.academicYear?.coCurricular || []).length > 0 ? (
                        data.academicYear.coCurricular.map((activity, index) => (
                          <div
                            key={`${activity.title}-${index}`}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <p className="font-medium text-slate-900">
                              {activity.title || "Untitled Activity"}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Level: {activity.level || "-"}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Position: {activity.position || "-"}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          No co-curricular activities recorded.
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                <section className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                  <h2 className="text-lg font-semibold text-slate-950">Teacher Remarks</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {data.academicYear?.teacherRemarks || "No remarks recorded."}
                  </p>
                </section>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
