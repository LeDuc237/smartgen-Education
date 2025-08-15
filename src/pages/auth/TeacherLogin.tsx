import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { getCompanyInfo } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../context/TranslationContext';
import { Home, LogIn } from 'lucide-react';

export default function TeacherLogin() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { language } = useTranslation(); 
  const { signIn, loading } = useAuthStore();
  const { data: companyInfo } = useQuery({
    queryKey: ['companyInfo'],
    queryFn: getCompanyInfo,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(identifier.toLowerCase(), password);
      toast.success(language === 'en' ? 'Successfully logged in!' : 'Connexion réussie !');
      navigate('/teacher-dashboard');
    } catch (error: any) {
      toast.error(
        error.message || (language === 'en' 
          ? 'Failed to login. Please check your credentials.' 
          : 'Échec de la connexion. Veuillez vérifier vos informations.')
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden pt-12 md:pt-20 px-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-green-50 to-blue-100 animate-gradient-flow"></div>

      {/* Header Section with Side-by-Side Buttons */}
      <div className="absolute top-4 md:top-6 left-0 right-0 px-4 md:px-6 flex justify-between items-center z-20">
        {/* Home Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 md:gap-2 group"
        >
          <div className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-x-1">
            <Home className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
          </div>
          <span className="hidden md:inline text-sm font-medium text-gray-700 bg-white/90 px-3 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {language === 'en' ? 'Home' : 'Accueil'}
          </span>
        </button>

        {/* Sign In Button */}
        <Link
          to="/teacher-register"
          className="flex items-center gap-1 md:gap-2 group bg-white/90 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <LogIn className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
          <span className="text-xs md:text-sm font-medium text-gray-700">
            {language === 'en' ? 'Create Account' : 'Créer un compte'}
          </span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-[90%] md:max-w-md bg-white/90 backdrop-blur-xl p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl border border-white/20 z-10 transform transition-all hover:shadow-lg md:hover:shadow-3xl mt-12 md:mt-16">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6 md:mb-10 space-y-2 md:space-y-4">
          {companyInfo?.logo ? (
            <img
              src={companyInfo.logo}
              alt="Company Logo"
              className="h-16 md:h-20 w-auto object-contain drop-shadow-lg"
            />
          ) : (
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center text-2xl md:text-3xl font-bold text-blue-600 shadow-inner">
              {companyInfo?.Name?.charAt(0) || 'E'}
            </div>
          )}
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 text-center">
            {companyInfo?.Name || 'SmartGen Educ'}
          </h1>
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 text-center">
            {language === 'en' ? 'Teacher Login' : "Connexion Enseignant"}
          </h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-1">
            <label htmlFor="identifier" className="block text-xs md:text-sm font-medium text-gray-600">
              {language === 'en' ? 'Email or Username' : "Email ou Nom d'utilisateur"}
            </label>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base bg-white/80 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400 transition-all"
              placeholder={language === 'en' ? 'teacher@example.com' : 'enseignant@exemple.com'}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs md:text-sm font-medium text-gray-600">
              {language === 'en' ? 'Password' : 'Mot de passe'}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base bg-white/80 border border-gray-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400 transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 md:py-3.5 text-sm md:text-base bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium rounded-lg md:rounded-xl hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">
                {language === 'en' ? 'Signing in...' : 'Connexion...'}
              </span>
            ) : (
              <span>{language === 'en' ? 'Sign In' : 'Se connecter'}</span>
            )}
          </button>
           {/* Registration Link with Hover Effect */}
          <div className="text-center pt-4">
            <Link
              to="/teacher-register"
              className="text-sm text-gray-600 hover:text-green-600 font-medium underline underline-offset-4 decoration-2 transition-colors group"
            >
              {language === 'en'
                ? 'New teacher? Create account →'
                : 'Nouveau enseignant ? Créer un compte →'}
              <span className="inline-block ml-1 group-hover:translate-x-1 transition-transform">
                🎓
              </span>
            </Link>
          </div>
        </form>
      </div>

      {/* Gradient Animation Styles */}
      <style jsx>{`
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-flow {
          background-size: 200% 200%;
          animation: gradient-flow 12s ease infinite;
        }
      `}</style>
    </div>
  );
}