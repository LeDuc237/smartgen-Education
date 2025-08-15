
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, Star, Book, MessageCircle, Globe, MapPin, Phone, X, Filter, Sparkles, ZoomIn } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "../context/TranslationContext"
import { useQuery } from "@tanstack/react-query"
import { getTeachers, getCompanyInfo } from "../lib/api"
import type { Teacher } from "../lib/types"

type Gender = "all" | "male" | "female"
type Category = "all" | "anglo" | "franco"

// Enhanced Loading Component for Teachers
const EnhancedTeacherLoadingCard = () => (
  <motion.div
    className="bg-white rounded-xl shadow-lg overflow-hidden"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="relative h-48 bg-gradient-to-br from-blue-100 via-green-100 to-blue-200 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer transform -skew-x-12"></div>
      <div className="absolute top-2 left-2 w-20 h-6 bg-gradient-to-r from-green-300 to-green-400 rounded-full animate-pulse"></div>
      <div className="absolute top-2 right-2 w-12 h-6 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full animate-pulse"></div>
      <div className="absolute bottom-4 left-4 flex space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
      </div>
    </div>

    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-3/4 bg-gradient-to-r from-blue-200 via-green-200 to-blue-200 rounded animate-pulse"></div>
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-full animate-pulse"></div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-200 to-green-200 rounded-full animate-pulse"></div>
          <div className="h-4 w-full bg-gradient-to-r from-green-200 via-blue-200 to-green-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-green-200 to-blue-200 rounded-full animate-pulse"></div>
          <div className="h-4 w-full bg-gradient-to-r from-blue-200 via-green-200 to-blue-200 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-10 flex-1 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg animate-pulse"></div>
        <div className="h-10 flex-1 bg-gradient-to-r from-green-200 to-green-300 rounded-lg animate-pulse"></div>
      </div>
    </div>
  </motion.div>
)

const MainLoadingScreen = ({ language }: { language: "en" | "fr" }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pt-36 px-4">
    <div className="max-w-7xl mx-auto">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center mb-6">
          <Sparkles className="h-12 w-12 text-blue-500 animate-spin mr-4" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {language === "en" ? "Loading Amazing Teachers..." : "Chargement des enseignants..."}
          </h1>
          <Sparkles className="h-12 w-12 text-green-500 animate-spin ml-4" />
        </div>

        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
        </div>

        <p className="text-xl text-gray-600 mb-4">
          {language === "en"
            ? "Discovering the best home teachers for you..."
            : "Découverte des meilleurs enseignants à domicile..."}
        </p>

        <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"></div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto mb-8">
        <div className="h-12 bg-gradient-to-r from-blue-100 to-green-100 rounded-xl animate-pulse"></div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="flex gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 bg-gradient-to-r from-blue-200 to-green-200 rounded-full animate-pulse"
            ></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[...Array(6)].map((_, index) => (
          <EnhancedTeacherLoadingCard key={index} />
        ))}
      </div>
    </div>
  </div>
)

export default function Teachers() {
  const { language } = useTranslation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGender, setSelectedGender] = useState<Gender>("all")
  const [selectedCategory, setSelectedCategory] = useState<Category>("all")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => getTeachers(),
  })

  const { data: companyInfo } = useQuery({
    queryKey: ["companyInfo"],
    queryFn: getCompanyInfo,
  })

  const genderOptions = [
    { id: "all", label: { fr: "Tous les enseignants", en: "All Teachers" } },
    { id: "male", label: { fr: "Enseignants hommes", en: "Male Teachers" } },
    { id: "female", label: { fr: "Enseignantes femmes", en: "Female Teachers" } },
  ]

  const categoryOptions = [
    { id: "all", label: { fr: "Toutes catégories", en: "All Categories" } },
    { id: "anglo", label: { fr: "Anglophones", en: "English" } },
    { id: "franco", label: { fr: "Francophones", en: "French" } },
  ]

  const filteredTeachers = teachers.filter((teacher) => {
    if (!teacher.is_approved) return false
    const matchesSearch =
      teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.subjects.join(", ").toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.location.join(", ").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = selectedGender === "all" || teacher.gender === selectedGender
    const matchesCategory = selectedCategory === "all" || teacher.category === selectedCategory
    return matchesSearch && matchesGender && matchesCategory
  })

  const NoTeachersMessage = () => (
    <motion.div
      className="col-span-full bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow-lg p-8 text-center border border-blue-100"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-lg mx-auto">
        <motion.div
          className="bg-gradient-to-br from-blue-500 to-green-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Phone className="h-10 w-10 text-white" />
        </motion.div>

        <h3 className="text-2xl font-bold mb-3">
          <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {language === "en" ? "No tutors found? No problem!" : "Pas de panique !"}
          </span>
        </h3>

        <p className="text-gray-600 mb-6">
          {language === "en"
            ? "We'll find the perfect tutor near you. Contact us now!"
            : "Vous pouvez toujours avoir un répétiteur prêt de chez vous !"}
        </p>

        <a
          href={`https://wa.me/${companyInfo?.whatsapp_number}?text=${encodeURIComponent(
            language === "en"
              ? "Hello, I'm looking for a home tutor but I can't find one in my area. Can you help me?"
              : "Bonjour, je cherche un répétiteur à domicile mais je n'en trouve pas dans ma zone. Pouvez-vous m'aider ?",
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-full font-medium inline-flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Phone size={20} />📲{" "}
          <span>{language === "en" ? "Contact us via WhatsApp" : "Contactez-nous via WhatsApp"}</span>
        </a>

        <div className="mt-4 text-sm text-blue-500 font-medium">{companyInfo?.contact || "+237 651 203 488"}</div>
      </div>
    </motion.div>
  )

  if (isLoading) {
    return <MainLoadingScreen language={language} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pt-28 px-4 pb-12">
      {/* Mobile Filters Sidebar */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
          <div
            className="fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-lg p-4 space-y-6 transform transition-transform duration-300 ease-in-out md:hidden"
            style={{ transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)" }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {language === "en" ? "Filters" : "Filtres"}
              </h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">{language === "en" ? "Gender" : "Genre"}</h3>
                {genderOptions.map((gender) => (
                  <button
                    key={gender.id}
                    onClick={() => setSelectedGender(gender.id)}
                    className={`w-full text-left px-4 py-2 rounded-full mb-1 transition-all duration-300 ${
                      selectedGender === gender.id
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {language === "en" ? gender.label.en : gender.label.fr}
                  </button>
                ))}
              </div>
              <div>
                <h3 className="font-medium mb-2">{language === "en" ? "Category" : "Catégorie"}</h3>
                {categoryOptions.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-2 rounded-full mb-1 transition-all duration-300 ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {language === "en" ? category.label.en : category.label.fr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header Section */}
      <motion.div
        className="text-center mb-8 md:mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
          <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {language === "en" ? "Our Amazing Teachers" : "Nos Enseignants Exceptionnels"}
          </span>
        </h1>
        <div className="w-20 md:w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full mb-4 md:mb-6"></div>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2">
          {language === "en"
            ? "Discover qualified home teachers ready to help your child succeed"
            : "Découvrez des enseignants à domicile qualifiés prêts à aider votre enfant à réussir"}
        </p>
      </motion.div>

      {/* Search Section */}
      <motion.div
        className="max-w-2xl mx-auto mb-6 md:mb-8 px-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="space-y-1">
          <label htmlFor="search-teacher" className="block text-base md:text-lg font-semibold text-center">
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {language === "en" ? "📚 Find Your Perfect Home Teacher" : "📚 Trouvez Votre Répétiteur Idéal"}
            </span>
          </label>

          <p className="text-xs md:text-sm text-gray-600 text-center mb-3 md:mb-4">
            {language === "en"
              ? "Just enter the neighborhood, subject, or teacher's name"
              : "Écrivez simplement le quartier, la matière ou le nom"}
          </p>

          <div className="relative group">
            <input
              id="search-teacher"
              type="text"
              placeholder={
                language === "en"
                  ? "e.g: 'Bastos Mathematics' or 'Mr. Dupont'..."
                  : "ex: 'Bastos Mathématiques' ou 'M. Dupont'..."
              }
              className="w-full px-5 py-3 md:px-6 md:py-4 border-2 border-gray-200 rounded-xl 
                       focus:ring-4 focus:ring-blue-100 focus:border-blue-500
                       placeholder-gray-400 text-gray-700 
                       transition-all duration-200 shadow-sm
                       hover:border-blue-200 pl-12 pr-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="absolute inset-y-0 left-3 md:left-4 flex items-center">
              <Search className="h-5 w-5 text-blue-500" strokeWidth={2.5} />
            </div>

            <div className="absolute inset-y-0 right-3 md:right-4 flex items-center">
              <span
                className="hidden sm:flex bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 px-2 py-1 rounded-full 
                              text-xs font-medium transform scale-90 opacity-90"
              >
                {language === "en" ? "Quick Search" : "Recherche Rapide"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Filter Button */}
      <div className="md:hidden flex justify-center mb-4 md:mb-6">
        <motion.button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Filter className="h-4 w-4" />
          {language === "en" ? "Filters" : "Filtres"}
        </motion.button>
      </div>

      {/* Desktop Filters */}
      <motion.div
        className="hidden md:flex flex-col items-center gap-4 md:gap-6 mb-6 md:mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {genderOptions.map((gender) => (
            <button
              key={gender.id}
              onClick={() => setSelectedGender(gender.id)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                selectedGender === gender.id
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200"
              }`}
            >
              {language === "en" ? gender.label.en : gender.label.fr}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {categoryOptions.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200"
              }`}
            >
              {language === "en" ? category.label.en : category.label.fr}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Teachers Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredTeachers.length === 0 ? (
            <NoTeachersMessage />
          ) : (
            filteredTeachers.map((teacher: Teacher, index) => (
              <motion.div
                key={teacher.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative h-48 md:h-56 bg-gradient-to-br from-blue-100 to-green-100">
                  <img
                    src={`${teacher.profile_image_url || "https://i.imgur.com/N6APfZL.png"}?ts=${Date.now()}`}
                    alt={`Professeur pour cours à domicile ${teacher.full_name}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    loading="lazy"
                    onClick={() => setSelectedTeacher(teacher)}
                  />

                  {/* Click to Zoom Indicator - Only shows on hover */}
                  <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <ZoomIn className="w-3 h-3" />
                    {language === "en" ? "Click to zoom" : "Cliquer pour agrandir"}
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-2">
                    <span
                      className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium backdrop-blur-sm ${
                        teacher.category === "anglo" ? "bg-green-500/90 text-white" : "bg-blue-500/90 text-white"
                      }`}
                    >
                      {teacher.category === "anglo"
                        ? language === "en"
                          ? "Anglo"
                          : "Anglophone"
                        : language === "en"
                          ? "Franco"
                          : "Francophone"}
                    </span>
                  </div>

                  {/* Success Rate */}
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 md:px-3 py-1 rounded-full flex items-center shadow-sm">
                    <Star className="text-yellow-500 mr-1" size={14} />
                    <span className="text-xs md:text-sm font-medium text-gray-700">
                      {teacher.success_rate?.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="p-4 md:p-5">
                  <div className="mb-3 md:mb-4">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1 line-clamp-1">
                      {teacher.gender === "male" ? "Mr." : "Mme"} {teacher.full_name}
                    </h3>
                    <div className="flex items-center text-gray-600">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center mr-2">
                        <Book className="text-white" size={12} />
                      </div>
                      <span className="text-xs md:text-sm font-medium line-clamp-1">
                        {teacher.subjects?.slice(0, 2).join(", ")}
                        {teacher.subjects?.length > 2 && "..."}
                      </span>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="mb-4 md:mb-5 flex items-start text-gray-600">
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mr-2 mt-0.5">
                      <MapPin className="text-white" size={12} />
                    </div>
                    <div className="text-xs md:text-sm">
                      <p className="font-medium text-gray-800 mb-0.5 line-clamp-1">{teacher.town}</p>
                      <p className="text-gray-500 line-clamp-1">
                        {teacher.location?.slice(0, 2).join(", ")}
                        {teacher.location?.length > 2 && "..."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 md:space-y-3">
                    <button
                      onClick={() => navigate(`/teachers/${teacher.id}`)}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 md:py-2.5 px-3 md:px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] text-xs md:text-sm"
                    >
                      {language === "en" ? "View Profile" : "Voir le profil"}
                    </button>
                    <a
                      href={`https://wa.me/${companyInfo?.whatsapp_number}?text=${encodeURIComponent(
                        language === "en"
                          ? `Hello, I want to learn more about home classes with ${teacher.full_name}`
                          : `Bonjour, je souhaite en savoir plus sur les cours à domicile avec ${teacher.full_name}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-2 md:py-2.5 px-3 md:px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] text-center flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
                    >
                      <Phone size={14} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Teacher Modal */}
      {selectedTeacher && (
        <div 
          className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4"
          onClick={() => setSelectedTeacher(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 sm:h-80 bg-gradient-to-br from-blue-50 to-green-50">
              <img
                src={`${selectedTeacher.profile_image_url || "https://i.imgur.com/N6APfZL.png"}`}
                alt={selectedTeacher.full_name}
                className="w-full h-full object-contain p-4"
              />
              <button
                onClick={() => setSelectedTeacher(null)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <X className="w-5 h-5 text-gray-800" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {selectedTeacher.gender === "male" ? "Mr." : "Mme"} {selectedTeacher.full_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTeacher.category === "anglo"
                          ? "bg-green-500 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {selectedTeacher.category === "anglo"
                        ? language === "en"
                          ? "Anglo"
                          : "Anglophone"
                        : language === "en"
                          ? "Franco"
                          : "Francophone"}
                    </span>
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                      <Star className="text-yellow-500 mr-1" size={14} />
                      <span className="text-xs font-medium text-gray-700">
                        {selectedTeacher.success_rate?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link
                    to={`/teachers/${selectedTeacher.id}`}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold hover:shadow-lg transition-all text-center text-sm sm:text-base"
                  >
                    {language === "en" ? "View Full Profile" : "Voir le profil complet"}
                  </Link>
                  <a
                    href={`https://wa.me/${companyInfo?.whatsapp_number}?text=${encodeURIComponent(
                      language === "en"
                        ? `Hello, I'm interested in home classes with ${selectedTeacher.full_name}`
                        : `Bonjour, je suis intéressé par des cours à domicile avec ${selectedTeacher.full_name}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none bg-green-600 text-white py-2 sm:py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Book className="text-blue-600" size={16} />
                    {language === "en" ? "Subjects Taught" : "Matières enseignées"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.subjects?.map((subject, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="text-green-600" size={16} />
                    {language === "en" ? "Location" : "Localisation"}
                  </h4>
                  <div className="space-y-1">
                    <p className="text-gray-700">
                      <span className="font-medium">{selectedTeacher.town}</span> -{" "}
                      {selectedTeacher.location?.join(", ")}
                    </p>
                    {selectedTeacher.is_approved && (
                      <p className="text-green-600 font-medium flex items-center gap-1">
                        <Globe size={14} />
                        {language === "en"
                          ? "Available for online classes"
                          : "Disponible pour les cours en ligne"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}