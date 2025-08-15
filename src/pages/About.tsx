import { Briefcase, Award, Users,  Phone } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import { useQuery } from '@tanstack/react-query';
import { getAdmins, getCompanyInfo } from '../lib/api';

export default function About() {
  const { language } = useTranslation();
  const { data: admins = [] } = useQuery({
    queryKey: ['admins'],
    queryFn: getAdmins,
  });

  const { data: companyInfo } = useQuery({
    queryKey: ['companyInfo'],
    queryFn: getCompanyInfo,
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <section 
        className="relative h-[400px] bg-cover bg-center text-white"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container-custom h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {language === 'en' ? 'About SmartGen Educ' : 'À propos de SmartGen Educ'}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl">
            {language === 'en' 
              ? 'Empowering the next generation with personalized, high-quality education — right at home.'
              : 'Offrir une éducation personnalisée et de haute qualité pour la prochaine génération, directement à domicile.'}
          </p>
        </div>
      </section>

     {/* Mission & Vision */}
<section className="section-padding">
  <div className="container-custom">
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
      {/* Image Container */}
      <div className="order-1 md:order-2 flex justify-center">
        <img
          src={companyInfo?.about_image2_url}
          alt="About SmartGen Educ"
          className="rounded-lg shadow-lg w-full max-w-[500px] h-[300px] md:h-[400px] object-cover"
        />
      </div>
      
      {/* Text Content */}
      <div className="order-2 md:order-1">
        <h2 className="text-3xl font-bold mb-6">
          {language === 'en' ? 'Our Mission & Vision' : 'Notre Mission et Vision'}
        </h2>
        <div className="space-y-6">
            <p className="text-gray-600 mb-6">
                {language === 'en' 
                  ? 'At SmartGen Educ, our mission is to provide high-quality, personalized education to students across Cameroon, particularly in Yaoundé and Douala. We are building a bridge between passionate, qualified teachers and families seeking dedicated support.'
                  : "Chez SmartGen Educ, notre mission est de fournir une éducation de haute qualité, personnalisée, aux étudiants du Cameroun, en particulier à Yaoundé et Douala. Nous construisons un pont entre les enseignants qualifiés et les familles à la recherche d'un soutien dédié."}
              </p>
          <p className="text-gray-600 mb-6">
                {language === 'en' 
                  ? 'We aim to foster confidence, improve academic results, and cultivate a love for learning — all from the comfort and safety of your home.'
                  : "Nous visons à favoriser la confiance, améliorer les résultats scolaires et cultiver l'amour de l'apprentissage - tout cela dans le confort et la sécurité de votre domicile."}
              </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Briefcase className="text-primary shrink-0" />
              <span>{language === 'en' ? 'Qualified Professionals' : 'Professionnels Qualifiés'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="text-primary shrink-0" />
              <span>{language === 'en' ? 'High Standards' : 'Normes Élevées'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="text-primary shrink-0" />
              <span>{language === 'en' ? 'Community Focused' : 'Axé sur la Communauté'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Team Section */}
<section className="py-20 bg-gradient-to-b from-gray-50 to-white">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
        {language === 'en' ? 'Our Leadership Team' : 'Notre Équipe de Direction'}
      </h2>
      <div className="w-24 h-1 bg-primary mx-auto"></div>
      <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
        {language === 'en' 
          ? 'Meet the passionate professionals guiding our vision forward'
          : 'Rencontrez les professionnels passionnés qui guident notre vision'}
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
      {admins.slice(0, 3).map((admin) => {
        const encodedMessage = encodeURIComponent(
          language === 'en' 
            ? `Hello ${admin.gender === 'male' ? 'Mr.' : 'Ms.'} ${admin.full_name},\n\nI would like to discuss your organizational structure and how we can collaborate. Please share more details.`
            : `Bonjour ${admin.gender === 'male' ? 'M.' : 'Mme'} ${admin.full_name},\n\nJe souhaiterais discuter de la structure de votre organisation et de possibilités de collaboration. Pourriez-vous m'en dire plus ?`
        );

        return (
          <div 
            key={admin.id} 
            className="group relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
          >
            {/* Image with overlay effect */}
            <div className="relative h-80 overflow-hidden">
              <img
                src={admin.profile_image_url || 'https://res.cloudinary.com/dfrznvwmu/image/upload/user-profiles/null.png'}
                alt={admin.full_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80"></div>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8 relative">
              {/* Role badge */}
              <span className="absolute -top-5 right-6 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                {admin.role === 'promoteur'
                  ? language === 'en' ? 'Founder' : 'Fondateur'
                  : admin.role === 'chef coordonateur'
                  ? language === 'en' ? 'Coordinator' : 'Coordonnateur'
                  : language === 'en' ? 'Supervisor' : 'Superviseur'}
              </span>

              <h3 className="text-2xl font-bold text-gray-900 mb-1">{admin.full_name}</h3>
              <p className="text-primary font-semibold mb-4">
                {admin.role === 'promoteur'
                  ? language === 'en' ? 'CEO & Founder' : 'PDG & Fondateur'
                  : admin.role === 'chef coordonateur'
                  ? language === 'en' ? 'Chief Coordinator' : 'Coordonnateur en Chef'
                  : language === 'en' ? 'Technical Lead' : 'Responsable Technique'}
              </p>

              <p className="text-gray-600 mb-6 leading-relaxed">{admin.about_me}</p>

              <div className="flex justify-center mt-6">
                <a
                  href={`https://wa.me/${admin.whatsapp_number}?text=${encodedMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white bg-[#25D366] hover:bg-[#128C7E] px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                >
                  <Phone size={20} className="shrink-0" />
                  <span>
                    {language === 'en' ? 'Contact via WhatsApp' : 'Contactez via WhatsApp'}
                  </span>
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>

    </div>
  );
}