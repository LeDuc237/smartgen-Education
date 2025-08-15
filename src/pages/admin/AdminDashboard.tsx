import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  LogOut,
  Globe,
  Menu,
  X,
  BarChart,
  Users,
  UserPlus,
  UserCheck,
  Bell,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../context/TranslationContext';
import {
  getAllTeachers,
  getStudents,
  getNotices,
  getStudentTeachers,
  getPayments,
  getAdmins,
} from '../../lib/api';

// Import components
import DashboardOverview from './components/DashboardOverview';
import TeacherManagement from './components/TeacherManagement';
import StudentManagement from './components/StudentManagement';
import NoticeManagement from './components/NoticeManagement';
import AddTeacher from './components/AddTeacher';
import AddStudent from './components/AddStudent';
import AdminManagement from './components/AdminManagement';
import CompanySettings from './components/CompanySettings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuthStore();
  const { language, toggleLanguage } = useTranslation();

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: getAllTeachers,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  });

  const { data: notices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: getNotices,
  });

  const { data: studentTeachers = [] } = useQuery({
    queryKey: ['studentTeachers'],
    queryFn: getStudentTeachers,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: getPayments,
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['admins'],
    queryFn: getAdmins,
  });

  useEffect(() => {
    if (!profile || role !== 'admin') {
      navigate('/admin');
    }
  }, [profile, role, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin');
    } catch (error) {
      toast.error(language === 'en' ? 'Failed to log out' : 'Échec de la déconnexion');
    }
  };

  const menuItems = [
    { id: 'overview', label: language === 'en' ? 'Overview' : 'Aperçu', icon: BarChart },
    { id: 'teachers', label: language === 'en' ? 'Teachers' : 'Enseignants', icon: Users },
    { id: 'students', label: language === 'en' ? 'Students' : 'Étudiants', icon: UserCheck },
    { 
      id: 'admins', 
      label: language === 'en' ? 'Admins' : 'Administrateurs', 
      icon: Users,
      show: profile?.role === 'promoteur' || profile?.role === 'chef coordonateur'
    },
    { id: 'notices', label: language === 'en' ? 'Notices' : 'Annonces', icon: Bell },
    { id: 'settings', label: language === 'en' ? 'Settings' : 'Paramètres', icon: Settings },
    { id: 'add-teacher', label: language === 'en' ? 'Add Teacher' : 'Ajouter un enseignant', icon: UserPlus },
    { id: 'add-student', label: language === 'en' ? 'Add Student' : 'Ajouter un étudiant', icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden bg-white p-2 rounded-lg shadow-lg mr-2"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="relative">
                {profile?.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {profile?.full_name || 'Admin'}
                </span>
                <span className="text-xs text-gray-500">
                  {language === 'en' ? 'Administrator' : 'Administrateur'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1.5 px-3 rounded-lg shadow transition-all ml-2"
              >
                <LogOut className="w-4 h-4 mr-1" />
                {language === 'en' ? 'Logout' : 'Déconnexion'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="hidden md:block text-xl font-bold text-gray-900">
                {language === 'en' ? 'Admin Dashboard' : 'Tableau de Bord Admin'}
              </h1>

              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm min-w-[2.5rem]"
              >
                <Globe className="w-4 h-4" />
                <span>{language.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
              <div className="fixed inset-0 z-40 md:hidden mt-16" onClick={() => setIsSidebarOpen(false)}>
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              </div>
            )}

            {/* Sidebar */}
            <div
              className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 transform transition-transform duration-200 ease-in-out 
                fixed md:static z-40 w-64 md:w-auto bg-white md:bg-transparent 
                h-[calc(100vh-4rem)] md:h-auto left-0 top-16 md:top-0 shadow-lg md:shadow-none p-4 md:p-0`}
            >
              <nav className="space-y-1">
                {menuItems
                  .filter(item => item.show === undefined || item.show)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                          activeTab === item.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </button>
                    );
                  })}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              <Outlet />
              {!window.location.pathname.includes('/admin/edit-teacher') && (
                <>
                  {activeTab === 'overview' && (
                    <DashboardOverview
                      teachers={teachers}
                      students={students}
                      notices={notices}
                      language={language}
                    />
                  )}

                  {activeTab === 'teachers' && (
                    <TeacherManagement teachers={teachers} language={language} />
                  )}

                  {activeTab === 'students' && (
                    <StudentManagement
                      students={students}
                      studentTeachers={studentTeachers}
                      payments={payments}
                      teachers={teachers}
                      language={language}
                    />
                  )}

                  {activeTab === 'notices' && <NoticeManagement />}

                  {activeTab === 'settings' && <CompanySettings />}

                  {activeTab === 'add-teacher' && <AddTeacher />}
                  {activeTab === 'add-student' && <AddStudent />}
                  {activeTab === 'admins' && profile?.role && ['promoteur', 'chef coordonateur'].includes(profile.role) && (
                    <AdminManagement admins={admins} language={language} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}