import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import AddAcademicYear from "./pages/AddAcademicYear";
import EditAcademicYear from "./pages/EditAcademicYear";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import StudentProfile from "./pages/StudentProfile";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherStudentDetail from "./pages/TeacherStudentDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/student/:id" element={<StudentProfile />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/students/:studentId"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherStudentDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/students/:studentId/add-year"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <AddAcademicYear />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/students/:studentId/years/:year/edit"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <EditAcademicYear />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
