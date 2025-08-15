import { useState, useMemo } from 'react';
import { Users, UserCheck, Bell, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Teacher, Student, Notice } from '../../../lib/types';
import { getPayments, getStudentTeachers } from '../../../lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardOverviewProps {
  teachers: Teacher[];
  students: Student[];
  notices: Notice[];
  language: 'en' | 'fr';
}

export default function DashboardOverview({ 
  teachers = [], 
  students = [], 
  notices = [], 
  language 
}: DashboardOverviewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Fetch real payment data
  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: getPayments,
  });

  const { data: studentTeachers = [] } = useQuery({
    queryKey: ['studentTeachers'],
    queryFn: getStudentTeachers,
  });

  // Calculate real earnings from payments
  const totalEarnings = useMemo(() => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  }, [payments]);

  // Calculate monthly earnings (current month)
  const monthlyEarnings = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return payments
      .filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      })
      .reduce((total, payment) => total + payment.amount, 0);
  }, [payments]);

  // Calculate active student-teacher relationships
  const activeRelationships = studentTeachers.length;

  // Prepare data for teacher categories chart
  const teacherCategories = useMemo(() => ({
    anglo: teachers.filter(t => t.category === 'anglo').length,
    franco: teachers.filter(t => t.category === 'franco').length,
    approved: teachers.filter(t => t.is_approved).length,
    pending: teachers.filter(t => !t.is_approved).length
  }), [teachers]);

  const teacherCategoriesData = {
    labels: [
      language === 'en' ? 'Anglophone' : 'Anglophone',
      language === 'en' ? 'Francophone' : 'Francophone'
    ],
    datasets: [
      {
        data: [teacherCategories.anglo, teacherCategories.franco],
        backgroundColor: ['#4CAF50', '#2196F3'],
        borderColor: ['#43A047', '#1E88E5'],
        borderWidth: 2,
      },
    ],
  };

  const teacherStatusData = {
    labels: [
      language === 'en' ? 'Approved' : 'Approuvés',
      language === 'en' ? 'Pending' : 'En attente'
    ],
    datasets: [
      {
        data: [teacherCategories.approved, teacherCategories.pending],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderColor: ['#059669', '#D97706'],
        borderWidth: 2,
      },
    ],
  };

  // Prepare data for growth chart with real data
  const growthData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
    
    // Calculate growth data for last 6 months
    const teacherGrowth = last6Months.map((_, index) => {
      const monthIndex = currentMonth - (5 - index);
      if (monthIndex < 0) return 0;
      
      // Count teachers created up to this month
      return teachers.filter(teacher => {
        const createdDate = new Date(teacher.created_at);
        return createdDate.getMonth() <= monthIndex;
      }).length;
    });

    const studentGrowth = last6Months.map((_, index) => {
      const monthIndex = currentMonth - (5 - index);
      if (monthIndex < 0) return 0;
      
      // Count students created up to this month
      return students.filter(student => {
        const createdDate = new Date(student.created_at);
        return createdDate.getMonth() <= monthIndex;
      }).length;
    });

    return {
      labels: last6Months,
      datasets: [
        {
          label: language === 'en' ? 'Teachers' : 'Enseignants',
          data: teacherGrowth,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 2,
          tension: 0.4,
        },
        {
          label: language === 'en' ? 'Students' : 'Étudiants',
          data: studentGrowth,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 2,
          tension: 0.4,
        },
      ],
    };
  }, [teachers, students, language]);

  // Calculate recent activity
  const recentActivities = useMemo(() => {
    const activities = [];
    
    // Recent teacher registrations
    const recentTeachers = teachers
      .filter(teacher => {
        const createdDate = new Date(teacher.created_at);
        const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      })
      .slice(0, 3);

    recentTeachers.forEach(teacher => {
      activities.push({
        type: 'teacher_registration',
        message: language === 'en' 
          ? `New teacher registration: ${teacher.full_name}`
          : `Nouvelle inscription enseignant: ${teacher.full_name}`,
        time: new Date(teacher.created_at),
        icon: Users
      });
    });

    // Recent payments
    const recentPayments = payments
      .filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        const daysDiff = (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      })
      .slice(0, 2);

    recentPayments.forEach(payment => {
      activities.push({
        type: 'payment',
        message: language === 'en' 
          ? `Payment received: ${payment.amount.toLocaleString()} XAF`
          : `Paiement reçu: ${payment.amount.toLocaleString()} XAF`,
        time: new Date(payment.payment_date),
        icon: DollarSign
      });
    });

    return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);
  }, [teachers, payments, language]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={language === 'en' ? 'Total Teachers' : 'Total des enseignants'}
          value={teachers.length}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          trend={`${teacherCategories.approved}/${teachers.length} ${language === 'en' ? 'approved' : 'approuvés'}`}
          color="blue"
        />
        <StatCard
          title={language === 'en' ? 'Total Students' : 'Total des étudiants'}
          value={students.length}
          icon={<UserCheck className="w-6 h-6 text-green-600" />}
          trend={`${activeRelationships} ${language === 'en' ? 'active' : 'actifs'}`}
          color="green"
        />
        <StatCard
          title={language === 'en' ? 'Active Notices' : 'Annonces actives'}
          value={notices.length}
          icon={<Bell className="w-6 h-6 text-purple-600" />}
          trend={language === 'en' ? 'Published' : 'Publiées'}
          color="purple"
        />
        <StatCard
          title={language === 'en' ? 'Monthly Revenue' : 'Revenus mensuels'}
          value={`${monthlyEarnings.toLocaleString()} XAF`}
          icon={<DollarSign className="w-6 h-6 text-yellow-600" />}
          trend={`${totalEarnings.toLocaleString()} XAF ${language === 'en' ? 'total' : 'total'}`}
          color="yellow"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">
              {language === 'en' ? 'Growth Overview' : 'Aperçu de la croissance'}
            </h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="week">{language === 'en' ? 'This Week' : 'Cette semaine'}</option>
              <option value="month">{language === 'en' ? 'Last 6 Months' : '6 derniers mois'}</option>
              <option value="year">{language === 'en' ? 'This Year' : 'Cette année'}</option>
            </select>
          </div>
          <Bar
            data={growthData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {/* Teacher Categories Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-6">
            {language === 'en' ? 'Teacher Distribution' : 'Répartition des enseignants'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">
                {language === 'en' ? 'By Category' : 'Par catégorie'}
              </h4>
              <div className="h-[150px]">
                <Doughnut
                  data={teacherCategoriesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          font: {
                            size: 10
                          }
                        }
                      },
                    },
                    cutout: '60%',
                  }}
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">
                {language === 'en' ? 'By Status' : 'Par statut'}
              </h4>
              <div className="h-[150px]">
                <Doughnut
                  data={teacherStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          font: {
                            size: 10
                          }
                        }
                      },
                    },
                    cutout: '60%',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'en' ? 'Recent Activity' : 'Activité récente'}
        </h3>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {activity.time.toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>{language === 'en' ? 'No recent activity' : 'Aucune activité récente'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}