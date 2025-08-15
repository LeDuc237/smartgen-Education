import React from 'react';
import { Menu, X, Globe, Phone, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import { getCompanyInfo } from '../lib/api';
import { useQuery } from '@tanstack/react-query';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { language, toggleLanguage } = useTranslation();
  const location = useLocation();

  const { data: companyInfo } = useQuery({
    queryKey: ['companyInfo'],
    queryFn: getCompanyInfo,
  });

  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const t = {
    home: language === 'en' ? 'Home' : 'Accueil',
    teacher: language === 'en' ? 'Teachers' : 'Enseignants',
    about: language === 'en' ? 'About Us' : 'À Propos',
    blog: language === "en" ? "Blog" : "Blog",
    login: language === 'en' ? 'Login' : 'Connexion',
    register: language === 'en' ? 'Register' : 'Inscription',
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      {/* Contact Bar */}
      <div className="bg-gradient-to-r from-blue-500 to-green-400 text-white text-sm py-2 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto md:flex md:justify-between md:items-center font-bold">
          {/* Desktop contact info */}
          <div className="hidden md:flex items-center gap-4">
            {companyInfo?.contact && (
              <a 
                href={`tel:${companyInfo.contact}`} 
                className="flex items-center gap-2 hover:text-green-100 transition-colors whitespace-nowrap"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{companyInfo.contact}</span>
              </a>
            )}
          </div>

          {/* Desktop schedule */}
          {companyInfo?.horaire && (
            <div className="md:flex items-center gap-4 hidden">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{language === 'en' ? 'Available:' : 'Disponibles:'}</span>
                <span>{companyInfo.horaire}</span>
              </div>
            </div>
          )}

          {/* Mobile marquee */}
          <div className="md:hidden overflow-hidden relative w-full">
            <div className="animate-marquee-mobile whitespace-nowrap flex items-center gap-4">
              {companyInfo?.contact && (
                <div className="inline-flex items-center gap-2 mr-4">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${companyInfo.contact}`} className="hover:text-green-100">
                    {companyInfo.contact}
                  </a>
                </div>
              )}

              {companyInfo?.horaire && (
                <div className="inline-flex items-center gap-2 mr-4">
                  <Clock className="w-4 h-4" />
                  <span>{language === 'en' ? 'Available:' : 'Disponibles:'}</span>
                  <span>{companyInfo.horaire}</span>
                </div>
              )}

              {/* Duplicate for seamless loop */}
              {companyInfo?.contact && (
                <div className="inline-flex items-center gap-2 mr-4">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${companyInfo.contact}`} className="hover:text-green-100">
                    {companyInfo.contact}
                  </a>
                </div>
              )}

              {companyInfo?.horaire && (
                <div className="inline-flex items-center gap-2 mr-4">
                  <Clock className="w-4 h-4" />
                  <span>{language === 'en' ? 'Available:' : 'Disponibles:'}</span>
                  <span>{companyInfo.horaire}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes marquee-mobile {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-mobile {
            animation: marquee-mobile 20s linear infinite;
            display: inline-block;
            min-width: max-content;
          }
          @media (max-width: 640px) {
            .animate-marquee-mobile {
              animation-duration: 25s;
            }
          }
        `}</style>
      </div>

      {/* Main Navigation */}
      <nav className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Company Name */}
<div className="flex items-center gap-3">
  <Link to="/" className="flex items-center gap-2">
    {companyInfo?.logo ? (
      <img
        src={companyInfo.logo}
        alt="Company Logo"
        className="h-10 w-auto object-contain"
      />
    ) : (
      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-green-100 flex items-center justify-center text-blue-600 font-bold">
        {companyInfo?.Name?.charAt(0) || 'E'}
      </div>
    )}
    <span className="hidden md:inline-block text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent whitespace-nowrap">
      {companyInfo?.Name || 'SmartGen Education'}
    </span>
  </Link>
</div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/" 
              className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              {t.home}
            </Link>
            <Link 
              to="/teachers" 
              className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              {t.teacher}
            </Link>
            <Link 
              to="/about" 
              className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              {t.about}
            </Link>
            <Link 
              to="/blog" 
              className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              {t.blog}
            </Link>
            <Link 
              to="/teacher-register" 
              className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-5 py-2 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              {t.register}
            </Link>
         <button 
  onClick={toggleLanguage}
  className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 transition-colors"
>
  <Globe className="w-5 h-5 text-gray-700" />
  <span className="text-sm font-medium">{language.toUpperCase()}</span>
</button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-3">
          
            {/* Language Toggle - Mobile */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Globe className="w-5 h-5 text-gray-700" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>

            {/* Teacher Button - Mobile */}
            <Link 
              to="/teachers" 
              className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-3 py-2 rounded-full text-sm font-semibold shadow-md hover:scale-105 transition-transform"
            >
              {t.teacher}
            </Link>

            {/* Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 py-3 border-t border-gray-100">
            <div className="flex flex-col gap-2">
              <Link 
                to="/" 
                className="px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {t.home}
              </Link>
              <Link 
                to="/teacher-register" 
                className="px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {t.register}
              </Link>
              <Link 
                to="/about" 
                className="px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {t.about}
              </Link>
              <Link 
                to="/blog" 
                className="px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {t.blog}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}