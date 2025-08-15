import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import Home from "./pages/Home";
import About from "./pages/About";
import Teachers from "./pages/Teachers";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import EditTeacherProfile from "./pages/EditTeacherProfil";
import TeacherLogin from "./pages/auth/TeacherLogin";
import TeacherRegister from "./pages/auth/TeacherRegister";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Blog from "./pages/Blog";
import { TranslationProvider } from "./context/TranslationContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddStudent from "./pages/admin/components/AddStudent";
import EditTeacher from "./pages/admin/components/EditTeacher";
import EditStudent from "./pages/admin/components/EditStudent";

const queryClient = new QueryClient();

function Layout() {
  const location = useLocation();

  // Routes where header and WhatsApp button should appear
  const showHeaderAndWhatsApp = [
    "/",
    "/about",
    "/teachers",
    "/blog",
    "/teachers/:id"
  ].some(path => {
    if (path.includes(":")) {
      // Handle dynamic routes like /teachers/:id
      const basePath = path.split("/:")[0];
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === path;
  });

  // Routes where footer should be hidden
  const hideFooterRoutes = [
    "/login",
    "/register",
    "/teacher-login",
    "/teacher-register",
    "/admin",
    "/teacher-dashboard",
    "/student-dashboard",
    "/admin-dashboard",
    "/edit-teacher-profile",
    "/admin/components/studentadd",
    "/admin/edit-teacher",
    "/admin/edit-student"
  ];

  const shouldShowFooter = !hideFooterRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen flex flex-col">
      {showHeaderAndWhatsApp && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/teachers/:id" element={<TeacherProfile />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/edit-teacher-profile" element={<EditTeacherProfile />} />
          <Route path="/admin/components/studentadd" element={<AddStudent />} />
          <Route path="/admin/edit-teacher/:id" element={<EditTeacher />} />
          <Route path="/admin/edit-student/:id" element={<EditStudent />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/teacher-login" element={<TeacherLogin />} />
          <Route path="/teacher-register" element={<TeacherRegister />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {shouldShowFooter && <Footer />}
      {showHeaderAndWhatsApp && <WhatsAppButton />}
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <Router>
          <Layout />
        </Router>
      </TranslationProvider>
    </QueryClientProvider>
  );
}

export default App;