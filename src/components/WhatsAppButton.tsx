import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import { getCompanyInfo } from '../lib/api';

export default function WhatsAppButton() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        setIsLoading(true);
        const data = await getCompanyInfo();
        setCompanyInfo(data);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch company info:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  // Return null while loading, if error, or if company info is not available
  if (isLoading || error || !companyInfo?.whatsapp_number) {
    return null;
  }

  const texts = {
    title: `${companyInfo.Name} (${companyInfo.whatsapp_number})`,
    subtitle: language === 'en' ? 'How can we help you?' : 'Comment pouvons-nous vous aider?',
    options: {
      homeTutoring: {
        title: language === 'en' ? 'Home Tutoring' : 'Cours à Domicile',
        description: language === 'en' ? 'Request a home tutor for your child' : 'Demander un répétiteur à domicile pour votre enfant'
      },
      becomeTeacher: {
        title: language === 'en' ? 'Become a Tutor' : 'Devenir Répétiteur',
        description: language === 'en' ? 'Join our network of home tutors' : 'Rejoindre notre réseau de répétiteurs'
      },
      onlineCourses: {
        title: language === 'en' ? 'Online Courses' : 'Cours en Ligne',
        description: language === 'en' ? 'Access our online learning platform' : 'Accéder à notre plateforme d\'apprentissage en ligne'
      },
      vipTutoring: {
        title: language === 'en' ? 'VIP Tutoring' : 'Répétiteur VIP',
        description: language === 'en' ? 'Premium personalized tutoring service' : 'Service de tutorat personnalisé premium'
      }
    },
    preview: {
      question: language === 'en' ? '💬 Need help?' : '💬 Besoin d\'aide?'
    }
  };

  const handleWhatsAppClick = (messageType: string) => {
    const messages = {
      homeTutoring: {
        en: "Hello, I'd like to request a home tutor for my child. Can you provide more information?",
        fr: "Bonjour, je voudrais un répétiteur à domicile pour mon enfant. Pouvez-vous me fournir plus d'informations?"
      },
      onlineCourses: {
        en: "Hello, I'm interested in your online courses. Can you send me details?",
        fr: "Bonjour, je suis intéressé par vos cours en ligne. Pouvez-vous m'envoyer des détails?"
      },
      vipTutoring: {
        en: "Hello, I'd like information about your VIP tutoring services",
        fr: "Bonjour, je voudrais des informations sur vos services de tutorat VIP"
      },
      default: {
        en: "Hello, I'd like information about SmartGen Educ services",
        fr: "Bonjour, je voudrais des informations sur les services SmartGen Educ"
      }
    };

    const messageKey = messageType in messages ? messageType : 'default';
    const message = messages[messageKey][language === 'en' ? 'en' : 'fr'];
    const encodedMessage = encodeURIComponent(message);
    
    window.open(`https://wa.me/${companyInfo.whatsapp_number}?text=${encodedMessage}`, '_blank');
    setIsExpanded(false);
  };

  const handleBecomeTeacher = () => {
    navigate('/teacher-register');
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded menu */}
      {isExpanded && (
        <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-blue-600 to-green-500 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{texts.title}</h3>
                <p className="text-sm opacity-90">{texts.subtitle}</p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="p-2 space-y-2">
            <button
              onClick={() => handleWhatsAppClick('homeTutoring')}
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="font-medium text-gray-800">{texts.options.homeTutoring.title}</div>
              <div className="text-sm text-gray-600">{texts.options.homeTutoring.description}</div>
            </button>
            
            <button
              onClick={handleBecomeTeacher}
              className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors border-l-4 border-blue-500"
            >
              <div className="font-medium text-blue-800">{texts.options.becomeTeacher.title}</div>
              <div className="text-sm text-blue-600">{texts.options.becomeTeacher.description}</div>
            </button>
            
            <button
              onClick={() => handleWhatsAppClick('onlineCourses')}
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="font-medium text-gray-800">{texts.options.onlineCourses.title}</div>
              <div className="text-sm text-gray-600">{texts.options.onlineCourses.description}</div>
            </button>
            
            <button
              onClick={() => handleWhatsAppClick('vipTutoring')}
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="font-medium text-gray-800">{texts.options.vipTutoring.title}</div>
              <div className="text-sm text-gray-600">{texts.options.vipTutoring.description}</div>
            </button>
          </div>
        </div>
      )}

      {/* Main WhatsApp button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition-all duration-300 transform hover:scale-110 ${
          isExpanded ? 'bg-green-600' : ''
        }`}
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="h-8 w-8" />
      </button>

      {/* Floating message preview */}
      {!isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 mr-2 bg-white rounded-lg shadow-lg p-3 max-w-xs animate-fade-in">
          <div className="text-sm text-gray-800 font-medium">{texts.preview.question}</div>
          <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200"></div>
        </div>
      )}
    </div>
  );
}