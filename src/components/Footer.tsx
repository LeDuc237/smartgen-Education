import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { useQuery } from '@tanstack/react-query';
import { getCompanyInfo } from '../lib/api';

export default function Footer() {
  const { language } = useTranslation();
  const { data: companyInfo } = useQuery({
    queryKey: ['companyInfo'],
    queryFn: getCompanyInfo,
  });

  const currentYear = new Date().getFullYear();

  // Cameroon-specific cities
  const cities = [
    "Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", 
    "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa", "Limbe"
  ];

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": language === 'en' 
                  ? "What courses do you offer at home?" 
                  : "Quels cours proposez-vous à domicile ?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": language === 'en'
                    ? "We offer courses in Mathematics, English, Physics, Biology, French, Computer Science, and more."
                    : "Nous proposons des cours en Mathématiques, Anglais, Physique, SVT, Français, Informatique et plus."
                }
              },
              {
                "@type": "Question",
                "name": language === 'en' 
                  ? "In which cities are you available in Cameroon?" 
                  : "Dans quelles villes du Cameroun êtes-vous disponible ?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": cities.join(", ")
                }
              }
            ]
          }),
        }}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": companyInfo?.Name || "SmartGen Education",
            "alternateName": "SmartGen",
            "description": language === 'en'
              ? "Leading private tutoring service in Cameroon offering home classes and online courses"
              : "Service de tutorat privé leader au Cameroun proposant des cours à domicile et en ligne",
            "url": "https://smartgen-educ.com",
            "logo": "/logo.png",
            "telephone": companyInfo?.contact || "+237 659 821 731",
            "email": companyInfo?.email || "smartgeneduc@gmail.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": companyInfo?.address || "N/A",
              "addressLocality": "Yaoundé",
              "addressRegion": "Centre",
              "postalCode": "N/A",
              "addressCountry": "CM"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 3.8480,
              "longitude": 11.5021
            },
            "openingHours": "Mo-Fr 08:00-18:00",
            "sameAs": [
              "https://web.facebook.com/smartgen.scholar/",
              "https://www.tiktok.com/@smartgeneducation",
              "https://www.instagram.com/smartgeneducation/"
            ]
          }),
        }}
      />

      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {/* Company Info */}
            <div className="space-y-5">
              <h3 className="text-2xl font-bold text-white">
                {companyInfo?.Name || "SmartGen Education"}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {(language === 'en'
                  ? companyInfo?.about_us_en
                  : companyInfo?.about_us_fr
                ) || (language === 'en'
                  ? "Premium private tutoring service in Cameroon offering personalized home classes and online courses."
                  : "Service de tutorat privé premium au Cameroun proposant des cours particuliers à domicile et en ligne.")}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <MapPin className="h-3 w-3 mr-1" />
                  {language === 'en' ? "Serving Cameroon" : "Service au Cameroun"}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {language === 'en' ? "Certified Tutors" : "Tuteurs Certifiés"}
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-5">
              <h4 className="text-lg font-semibold text-white">
                {language === 'en' ? 'Quick Links' : 'Liens Rapides'}
              </h4>
              <ul className="space-y-3">
                {[
                  { path: "/", label: language === 'en' ? 'Home' : 'Accueil' },
                  { path: "/about", label: language === 'en' ? 'About Us' : 'À propos' },
                  { path: "/blog", label: language === 'en' ? 'Blog' : 'Blog' },
                  { path: "/login", label: language === 'en' ? 'Student Login' : 'Espace Étudiant' },
                  { path: "/teacher-login", label: language === 'en' ? 'Teacher Portal' : 'Portail Enseignant' },
                  { path: "/admin", label: language === 'en' ? 'Admin Login' : 'Espace Admin' },
                ].map((link) => (
                  <li key={link.path}>
                    <Link 
                      to={link.path} 
                      className="text-gray-300 hover:text-white transition-colors text-sm flex items-center group"
                    >
                      <span className="group-hover:underline">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Information */}
            <div className="space-y-5">
              <h4 className="text-lg font-semibold text-white">
                {language === 'en' ? 'Contact Us' : 'Contactez-nous'}
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-300" />
                  <div>
                    <a 
                      href={`tel:${companyInfo?.contact || "+237659821731"}`} 
                      className="text-gray-300 hover:text-white text-sm block transition-colors"
                    >
                      {companyInfo?.contact || "+237 659 821 731"}
                    </a>
                    <span className="text-gray-400 text-xs">
                      {language === 'en' ? 'Monday - Friday, 8AM - 6PM' : 'Lundi - Vendredi, 8H - 18H'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-300" />
                  <a 
                    href={`mailto:${companyInfo?.email || "smartgeneduc@gmail.com"}`} 
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {companyInfo?.email || "smartgeneduc@gmail.com"}
                  </a>
                </li>
                {companyInfo?.address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-300" />
                    <span className="text-gray-300 text-sm">
                      {companyInfo.address}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Social Media */}
            <div className="space-y-5">
              <h4 className="text-lg font-semibold text-white">
                {language === 'en' ? 'Follow Us' : 'Suivez-nous'}
              </h4>
              
              <div className="flex space-x-4">
                {[
                  {
                    href: "https://web.facebook.com/smartgen.scholar/",
                    icon: <Facebook size={20} />,
                    label: "Facebook"
                  },
                  {
                    href: "https://www.tiktok.com/@smartgeneducation",
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 8a5 5 0 0 0-5-5 1 1 0 0 0 0 2 3 3 0 0 1 3 3v6a4 4 0 1 1-4-4v2a4.91 4.91 0 0 0 2 .5 5 5 0 0 0 5-5z" />
                        <path d="M12 15v2a4.91 4.91 0 0 0 2-.5v2a7 7 0 1 1-5-6.7" />
                      </svg>
                    ),
                    label: "TikTok"
                  },
                  {
                    href: "https://www.instagram.com/smartgeneducation/",
                    icon: <Instagram size={20} />,
                    label: "Instagram"
                  },
                  {
                    href: `https://wa.me/${companyInfo?.whatsapp_number || "237659821731"}?text=${encodeURIComponent(
                      language === "en"
                        ? "Hello, I'm interested in home classes"
                        : "Bonjour, je suis intéressé par des cours à domicile"
                    )}`,
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    ),
                    label: "WhatsApp"
                  }
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors hover:scale-110"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>

              {/* Yellow Pages Badge */}
              <div className="mt-6">
                <a 
                  href="https://www.pagesjaunes.online/cameroun/yaoundé/education/smartgen-education?from=badge"  
                  title={language === 'en' 
                    ? "Find us on Cameroon Yellow Pages" 
                    : "Trouvez-nous sur Pages Jaunes du Cameroun"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <img 
                    src="https://www.pagesjaunes.online/images/memberbadge.png" 
                    alt={language === 'en' 
                      ? "Cameroon Yellow Pages Badge" 
                      : "Badge Pages Jaunes Cameroun"} 
                    className="h-8 hover:opacity-90 transition-opacity"
                    style={{ border: 'none' }} 
                  />
                </a>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mt-16 border-t border-gray-800 pt-10">
            <h2 className="text-xl font-semibold mb-6 text-white">
              {language === 'en' ? 'Frequently Asked Questions' : 'Questions fréquemment posées'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-100">
                  {language === 'en' 
                    ? 'What subjects do you offer?' 
                    : 'Quelles matières proposez-vous ?'}
                </h3>
                <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                  {language === 'en'
                    ? 'We offer Mathematics, English, Physics, Chemistry, Biology, French, Computer Science, and more for primary, secondary, and high school students.'
                    : 'Nous proposons des cours en Mathématiques, Anglais, Physique, Chimie, SVT, Français, Informatique et plus pour les élèves du primaire, secondaire et lycée.'}
                </p>
              </div>
              <div className="bg-gray-800 p-5 rounded-lg">
                <h3 className="font-semibold text-gray-100">
                  {language === 'en' 
                    ? 'Which cities in Cameroon do you serve?' 
                    : 'Dans quelles villes du Cameroun intervenez-vous ?'}
                </h3>
                <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                  {cities.slice(0, 5).join(", ")} {language === 'en' ? 'and more' : 'et plus'}
                </p>
              </div>
            </div>
          </section>

          {/* Copyright */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} {companyInfo?.Name || "SmartGen Education"}.{' '}
              {language === 'en' ? 'All rights reserved.' : 'Tous droits réservés.'}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              {language === 'en' 
                ? 'Registered educational service in Cameroon' 
                : 'Service éducatif enregistré au Cameroun'}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}