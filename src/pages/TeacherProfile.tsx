import { useParams } from 'react-router-dom';
import { Star, Phone, MapPin, Briefcase, Book, Clock, Library, MessageCircle, GraduationCap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTeacherd, getCompanyInfo } from '../lib/api';
import { useTranslation } from '../context/TranslationContext';
import { useState } from 'react';
import { motion } from 'framer-motion';

const randomReviewerNamesEn = [
  'Decarte Smith', 'Onana Johnson', 'Michael SOU', 'Sophia Davis', 'Daniel Feufack',
  'Olivia', 'Taylor', 'Isabella Anderson', 'neba Thomas', 'Emma Morgan'
];

const randomReviewerNamesFr = [
  'Jean Justin', 'Marie', 'Martin', 'Sophie nana', 'Antoine Fofack',
  'Claire', 'Luc Atangana', 'Julie', 'Marc onana', 'Emma'
];

// Some different review templates to mix and match (in English and French)
const randomReviewTemplatesEn = [
  "Very patient and explains things clearly.",
  "My child improved a lot thanks to the lessons.",
  "Highly recommend for anyone looking for quality home teaching.",
  "Always punctual and prepared with great material.",
  "Makes learning fun and easy to understand."
];

const randomReviewTemplatesFr = [
  "Très patient et explique clairement les choses.",
  "Mon enfant a beaucoup progressé grâce aux cours.",
  "Je recommande vivement pour quiconque cherche un enseignement de qualité à domicile.",
  "Toujours ponctuel et préparé avec du bon matériel.",
  "Rend l'apprentissage amusant et facile à comprendre."
];

export default function TeacherProfile() {
  const { id } = useParams<{ id: string }>();
  const { language } = useTranslation();
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => getTeacherd(id!),
    enabled: !!id,
  });

  const { data: companyInfo } = useQuery({
    queryKey: ['companyInfo'],
    queryFn: getCompanyInfo,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gradient-to-r from-blue-500 to-green-500"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <p className="text-xl text-gray-600">
          {language === 'en' ? 'Teacher not found' : 'Enseignant non trouvé'}
        </p>
      </div>
    );
  }

  const dayTranslations = {
    Monday: language === 'en' ? 'Monday' : 'Lundi',
    Tuesday: language === 'en' ? 'Tuesday' : 'Mardi',
    Wednesday: language === 'en' ? 'Wednesday' : 'Mercredi',
    Thursday: language === 'en' ? 'Thursday' : 'Jeudi',
    Friday: language === 'en' ? 'Friday' : 'Vendredi',
    Saturday: language === 'en' ? 'Saturday' : 'Samedi',
    Sunday: language === 'en' ? 'Sunday' : 'Dimanche',
  };

  // Generate gender-specific review
  const genderSpecificReview = teacher.gender === 'male'
    ? (language === 'en'
      ? "Mr. is an excellent teacher who explains concepts clearly."
      : "M. est un excellent professeur qui explique clairement les concepts.")
    : (language === 'en'
      ? "Mme. has a wonderful teaching approach that makes learning enjoyable."
      : "Mme. a une merveilleuse approche d'enseignement qui rend l'apprentissage agréable.");

  // Generate language-specific review
  const languageSpecificReview = teacher.category === 'anglo'
    ? (language === 'en'
      ? "Teaches in perfect English with great pronunciation."
      : "Enseigne en parfait anglais avec une excellente prononciation.")
    : (language === 'en'
      ? "Teaches in perfect French with excellent grammar."
      : "Enseigne en parfait français avec une excellente grammaire.");

  // Generate location-specific review
  const locationSpecificReview = teacher.town
    ? (language === 'en'
      ? `Conveniently located in ${teacher.town} with flexible scheduling.`
      : `Situé à ${teacher.town} avec un emploi du temps flexible.`)
    : "";

  // Prepare random reviews with random names for auto-generated ones
  function getRandomReviewAndName(index: number) {
    const names = language === 'en' ? randomReviewerNamesEn : randomReviewerNamesFr;
    const reviews = language === 'en' ? randomReviewTemplatesEn : randomReviewTemplatesFr;
    // Rotate through arrays by index for variety
    const name = names[index % names.length];
    const content = reviews[index % reviews.length];
    return { name, content };
  }

  // Start with real comments from teacher.comments, if any
  const realComments = teacher.comments?.map((c) => ({
    id: c.id,
    content: c.content,
    rating: c.rating,
    created_at: c.created_at,
    reviewerName: c.students?.full_name || (language === 'en' ? 'Anonymous' : 'Anonyme'),
  })) || [];

  // Add the 3 automatic reviews, but replace auto review with random names and varied content
  const autoReviews = [
    { id: 'auto1', content: genderSpecificReview, rating: 5 },
    { id: 'auto2', content: languageSpecificReview, rating: 5 },
    ...(locationSpecificReview ? [{ id: 'auto3', content: locationSpecificReview, rating: 5 }] : []),
  ].map((review, idx) => {
    const { name, content } = getRandomReviewAndName(idx);
    // Mix gender/language/location review content with random template for variety
    const combinedContent = `${review.content} ${content}`;
    return {
      id: review.id,
      content: combinedContent,
      rating: review.rating,
      created_at: new Date().toISOString(),
      reviewerName: name,
    };
  });

  const allReviews = [...realComments, ...autoReviews];

  return (
    <div className="min-h-screen bg-gradient-to-br pt-32 from-blue-50 via-white to-green-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {teacher.gender === 'male'
              ? (language === 'en' ? 'Mr.' : 'M.')
              : (language === 'en' ? 'Mme.' : 'Mme')} {teacher.full_name}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full my-4"></div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                      {language === 'en'
                        ? `Welcome to the profile of ${teacher.full_name}`
                        : `Bienvenue sur le profil de ${teacher.full_name}`}
                    </h2>
        </motion.div>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden mb-8"
        >
          {/* Profile Banner */}
          <div className="relative h-48 sm:h-56 w-full ">
            <img
              src={`${teacher.profile_image_url || 'https://i.imgur.com/N6APfZL.png'}?ts=${Date.now()}`}
              alt={`${teacher.full_name}`}
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="flex items-center gap-4 w-full">
                <img
                  src={`${teacher.profile_image_url || 'https://i.imgur.com/N6APfZL.png'}?ts=${Date.now()}`}
                  alt={`${teacher.full_name}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">{teacher.full_name}</h2>
                    <div className="flex items-center bg-white/90 px-3 py-1 rounded-full">
                      <Star className="text-yellow-500 mr-1" size={16} />
                      <span className="text-sm font-medium text-gray-800">
                        {teacher.success_rate?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm sm:text-base mt-1">
                    {teacher.category === 'anglo'
                      ? language === 'en' ? 'English Teacher' : 'Enseignant Anglophone'
                      : language === 'en' ? 'French Teacher' : 'Enseignant Francophone'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                <section>
                 <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {language === 'en' ? 'Teaching Philosophy' : 'Philosophie d\'enseignement'}
                  </h2>
                 <p className="text-gray-700 leading-relaxed">
                    {teacher.about_me || (language === 'en' 
                      ? 'I believe every student has unique learning needs. My approach combines structured lessons with personalized attention to help each student reach their full potential. With years of experience and a passion for education, I create an engaging learning environment that makes complex concepts accessible.' 
                      : 'Je crois que chaque élève a des besoins d\'apprentissage uniques. Mon approche combine des leçons structurées avec une attention personnalisée pour aider chaque élève à atteindre son plein potentiel. Avec des années d\'expérience et une passion pour l\'éducation, je crée un environnement d\'apprentissage engageant qui rend les concepts complexes accessibles.')}
                  </p>
                </section>

                {/* Subjects Section */}
                <section>
                 <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {language === 'en' ? 'Subjects & Specializations' : 'Matières & Spécialisations'}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {teacher.subjects?.map((subject) => (
                      <span
                        key={subject}
                        className="px-4 py-2 bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        <Book size={14} />
                        {subject}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Reviews Section */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                      {language === 'en' ? 'Student Testimonials' : 'Témoignages d\'Élèves'}
                    </h2>
                    <div className="flex items-center">
                      <Star className="text-yellow-500 mr-1" />
                      <span className="font-medium">
                        {teacher.success_rate?.toFixed(1)} ({allReviews.length} {language === 'en' ? 'reviews' : 'avis'})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(showAllReviews ? allReviews : allReviews.slice(0, 2)).map((review, index) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-gradient-to-br from-blue-50 to-green-50 p-5 rounded-lg border border-gray-100"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-gray-800">{review.reviewerName || (language === 'en' ? 'Anonymous' : 'Anonyme')}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
                            <Star className="text-yellow-500 mr-1" size={14} />
                            <span className="text-sm font-medium">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.content}</p>
                      </motion.div>
                    ))}
                  </div>

                  {allReviews.length > 2 && (
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="mt-4 text-blue-600 font-medium hover:text-blue-800 transition-colors"
                    >
                      {showAllReviews
                        ? language === 'en' ? 'Show Less' : 'Voir moins'
                        : language === 'en' ? 'View All Reviews' : 'Voir tous les avis'}
                    </button>
                  )}
                </section>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Card */}
                <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-xl border border-gray-200">
                  <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {language === 'en' ? 'Contact Info' : 'Coordonnées'}
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{language === 'en' ? 'Location' : 'Localisation'}</p>
                        <p className="font-medium">
                          {teacher.town} - {teacher.location?.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{language === 'en' ? 'Current Work' : 'Travail actuel'}</p>
                        <p className="font-medium">{teacher.current_work}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {language === 'en' ? 'Highest Diploma' : 'Diplôme le plus élevé'}
                        </p>
                        <p className="font-medium">{teacher.highest_diploma}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {language === 'en' ? 'Available Days' : 'Jours disponibles'}
                        </p>
                        <p className="font-medium">
                          {teacher.available_days
                            ?.map(day => dayTranslations[day] || day)
                            .join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${companyInfo?.whatsapp_number}?text=${encodeURIComponent(
                      language === 'en'
                        ? `Hello, I'm interested in home classes with ${teacher.full_name}`
                        : `Bonjour, je suis intéressé par des cours à domicile avec ${teacher.full_name}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
                  >
                    <MessageCircle size={18} />
                    {language === 'en' ? 'Contact via WhatsApp' : 'Contacter via WhatsApp'}
                  </a>
                </div>

                {/* Stats Card */}
                 <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {language === 'en' ? 'Teaching Statistics' : 'Statistiques'}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-100 rounded-full text-blue-600">
                          <Library size={16} />
                        </div>
                        <span className="text-gray-600">
                          {language === 'en' ? 'Students' : 'Élèves'}
                        </span>
                      </div>
                      <span className="font-bold text-blue-600">{teacher.number_reviews || 15}+</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-green-100 rounded-full text-green-600">
                          <Briefcase size={16} />
                        </div>
                        <span className="text-gray-600">
                          {language === 'en' ? 'Experience' : 'Expérience'}
                        </span>
                      </div>
                      <span className="font-bold text-green-600">
                        {teacher.years_experience || 3}+ {language === 'en' ? 'years' : 'ans'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-gradient-to-r from-blue-100 to-green-100 rounded-full text-gradient-to-r from-blue-600 to-green-600">
                          <Star size={16} />
                        </div>
                        <span className="text-gray-600">
                          {language === 'en' ? 'Success Rate' : 'Taux de réussite'}
                        </span>
                      </div>
                      <span className="font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        {teacher.success_rate || 45}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
