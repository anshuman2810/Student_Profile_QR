import { useMemo, useState } from "react";
import { getAcademicYearOptions } from "../utils/academicYears";
import { classOptions, sectionOptions } from "../utils/classroomOptions";

const emptyActivity = { title: "", level: "", position: "" };
const emptyTestReport = { subjectName: "", testName: "", totalMarks: "", receivedMarks: "" };

const sectionTabs = [
  { id: "overview", label: "Overview" },
  { id: "tests", label: "Tests" },
  { id: "activities", label: "Activities" },
  { id: "remarks", label: "Remarks" },
];

function normalizeAcademicYear(data) {
  return {
    year: data?.year ?? "",
    className: data?.className ?? "",
    section: data?.section ?? "",
    teacherRemarks: data?.teacherRemarks ?? "",
    attendanceRecords: Array.isArray(data?.attendanceRecords)
      ? data.attendanceRecords.map((record) => ({
          date: record.date ?? "",
          status: record.status ?? "present",
        }))
      : [],
    testReports:
      data?.testReports?.length > 0
        ? data.testReports.map((report) => ({
            subjectName: report.subjectName ?? "",
            testName: report.testName ?? "",
            totalMarks: report.totalMarks ?? "",
            receivedMarks: report.receivedMarks ?? "",
          }))
        : [{ ...emptyTestReport }],
    coCurricular:
      data?.coCurricular?.length > 0
        ? data.coCurricular.map((activity) => ({
            title: activity.title ?? "",
            level: activity.level ?? "",
            position: activity.position ?? "",
          }))
        : [{ ...emptyActivity }],
  };
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100";
}

export default function AcademicYearEditor({
  title,
  description,
  initialValue,
  submitLabel,
  loading,
  onSubmit,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState(() => normalizeAcademicYear(initialValue));

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateListItem = (key, index, field, value) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addListItem = (key, template) => {
    setForm((current) => ({
      ...current,
      [key]: [...current[key], { ...template }],
    }));
  };

  const removeListItem = (key, index, template) => {
    setForm((current) => ({
      ...current,
      [key]:
        current[key].length === 1
          ? [{ ...template }]
          : current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  };
  const academicYearOptions = useMemo(() => getAcademicYearOptions([form.year]), [form.year]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      attendanceRecords: form.attendanceRecords,
      subjects: [],
      testReports: form.testReports
        .filter((report) => report.subjectName || report.testName || report.totalMarks || report.receivedMarks)
        .map((report) => ({
          ...report,
          totalMarks: report.totalMarks === "" ? undefined : Number(report.totalMarks),
          receivedMarks:
            report.receivedMarks === "" ? undefined : Number(report.receivedMarks),
        })),
      coCurricular: form.coCurricular.filter(
        (activity) => activity.title || activity.level || activity.position,
      ),
    };

    onSubmit(payload);
  };

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            {sectionTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Academic Year">
              <select
                className={inputClassName()}
                value={form.year}
                onChange={(event) => updateField("year", event.target.value)}
                required
              >
                <option value="">Select academic year</option>
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Class">
              <select
                className={inputClassName()}
                value={form.className}
                onChange={(event) => updateField("className", event.target.value)}
              >
                <option value="">Select class</option>
                {classOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Section">
              <select
                className={inputClassName()}
                value={form.section}
                onChange={(event) => updateField("section", event.target.value)}
              >
                <option value="">Select section</option>
                {sectionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {activeTab === "tests" ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-950">Test Reports</h2>
              <button
                type="button"
                className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                onClick={() => addListItem("testReports", emptyTestReport)}
              >
                Add Test
              </button>
            </div>

            {form.testReports.map((report, index) => (
              <div
                key={`test-${index}`}
                className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.1fr_1.2fr_0.8fr_0.8fr_auto]"
              >
                <input
                  className={inputClassName()}
                  value={report.subjectName}
                  onChange={(event) =>
                    updateListItem("testReports", index, "subjectName", event.target.value)
                  }
                  placeholder="Mathematics"
                />
                <input
                  className={inputClassName()}
                  value={report.testName}
                  onChange={(event) =>
                    updateListItem("testReports", index, "testName", event.target.value)
                  }
                  placeholder="Unit Test 1"
                />
                <input
                  className={inputClassName()}
                  value={report.totalMarks}
                  onChange={(event) =>
                    updateListItem("testReports", index, "totalMarks", event.target.value)
                  }
                  placeholder="100"
                  type="number"
                  step="0.01"
                />
                <input
                  className={inputClassName()}
                  value={report.receivedMarks}
                  onChange={(event) =>
                    updateListItem("testReports", index, "receivedMarks", event.target.value)
                  }
                  placeholder="86"
                  type="number"
                  step="0.01"
                />
                <button
                  type="button"
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                  onClick={() => removeListItem("testReports", index, emptyTestReport)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "activities" ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-950">Co-curricular</h2>
              <button
                type="button"
                className="rounded-full border border-cyan-200 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                onClick={() => addListItem("coCurricular", emptyActivity)}
              >
                Add Activity
              </button>
            </div>

            {form.coCurricular.map((activity, index) => (
              <div
                key={`activity-${index}`}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]"
              >
                <input
                  className={inputClassName()}
                  value={activity.title}
                  onChange={(event) =>
                    updateListItem("coCurricular", index, "title", event.target.value)
                  }
                  placeholder="Science Olympiad"
                />
                <input
                  className={inputClassName()}
                  value={activity.level}
                  onChange={(event) =>
                    updateListItem("coCurricular", index, "level", event.target.value)
                  }
                  placeholder="District"
                />
                <input
                  className={inputClassName()}
                  value={activity.position}
                  onChange={(event) =>
                    updateListItem("coCurricular", index, "position", event.target.value)
                  }
                  placeholder="Runner-up"
                />
                <button
                  type="button"
                  className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                  onClick={() => removeListItem("coCurricular", index, emptyActivity)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "remarks" ? (
          <Field label="Teacher Remarks">
            <textarea
              className={`${inputClassName()} min-h-40 resize-y`}
              value={form.teacherRemarks}
              onChange={(event) => updateField("teacherRemarks", event.target.value)}
              placeholder="Teacher remarks"
            />
          </Field>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="submit"
          className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={loading}
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
