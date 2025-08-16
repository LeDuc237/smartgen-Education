"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Star,
  Book,
  MapPin,
  Phone,
  ArrowRight,
  ArrowLeft,
  Users,
  GraduationCap,
  CalendarDays,
  Globe,
  Brain,
  CheckCircle,
  Trophy,
  MessageCircle,
  ZoomIn,
  Award,
  X,
  Target,
  LogIn,
  UserCheck,
} from "lucide-react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "../context/TranslationContext"
import { getTeacher, getCompanyInfo } from "../lib/api"
import type { Teacher } from "../lib/types"

interface QuizInteractifProps {
  whatsappNumber: string
  language: "en" | "fr"
}

const QuizInteractif: React.FC<QuizInteractifProps> = ({ whatsappNumber, language }) => {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState<boolean>(false)
  const [score, setScore] = useState<number>(0)
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false)
  const [selectedLevel, setSelectedLevel] = useState<"primary" | "secondary" | null>(null)

  // Bilingual quiz content with primary and secondary levels
  const quizContent = {
    en: {
      title: "Student Knowledge Challenge",
      subtitle: "Test your knowledge across different subjects",
      questionCounter: "Question",
      of: "of",
      score: "Score",
      explanation: "Explanation",
      nextQuestion: "Next Question",
      seeResults: "See Results",
      completed: "Quiz Completed!",
      successRate: "% Success Rate",
      level: "Level",
      shareResults: "Share Results on WhatsApp",
      restart: "Restart Quiz",
      selectLevel: "Choose Your Level",
      primary: "Primary",
      secondary: "Secondary",
      levels: {
        beginner: "Beginner",
        intermediate: "Intermediate",
        expert: "Expert",
      },
      primaryQuestions: [
        // Math - Primary
        {
          subject: "Mathematics",
          question: "What is 15 + 27?",
          options: ["40", "42", "44", "46"],
          correct: 1,
          explanation: "15 + 27 = 42",
        },
        // French - Primary
        {
          subject: "French",
          question: "Which is the correct plural of 'chat'?",
          options: ["chats", "chates", "chat", "chatss"],
          correct: 0,
          explanation: "The plural of 'chat' is 'chats'",
        },
        // English - Primary
        {
          subject: "English",
          question: "What is the past tense of 'go'?",
          options: ["goed", "went", "gone", "going"],
          correct: 1,
          explanation: "The past tense of 'go' is 'went'",
        },
        // Science - Primary
        {
          subject: "Science",
          question: "How many legs does a spider have?",
          options: ["6", "8", "10", "12"],
          correct: 1,
          explanation: "Spiders have 8 legs",
        },
        // Geography - Primary
        {
          subject: "Geography",
          question: "What is the capital of Cameroon?",
          options: ["Douala", "Yaoundé", "Bafoussam", "Garoua"],
          correct: 1,
          explanation: "Yaoundé is the capital of Cameroon",
        },
      ],
      secondaryQuestions: [
        // Math - Secondary
        {
          subject: "Mathematics",
          question: "Solve for x: 3x + 5 = 17",
          options: ["x = 4", "x = 5", "x = 6", "x = 7"],
          correct: 0,
          explanation: "3x + 5 = 17 → 3x = 12 → x = 4",
        },
        // Physics - Secondary
        {
          subject: "Physics",
          question: "Which formula represents Newton's Second Law?",
          options: ["F = ma", "P = mv", "E = mc²", "V = IR"],
          correct: 0,
          explanation: "Newton's Second Law states that Force = mass × acceleration",
        },
        // Chemistry - Secondary
        {
          subject: "Chemistry",
          question: "What type of reaction is: 2H₂ + O₂ → 2H₂O?",
          options: ["Combination", "Decomposition", "Displacement", "Double displacement"],
          correct: 0,
          explanation: "Two elements combine to form a single compound",
        },
        // Biology - Secondary
        {
          subject: "Biology",
          question: "Which organelle is responsible for protein synthesis?",
          options: ["Mitochondria", "Ribosome", "Nucleus", "Golgi apparatus"],
          correct: 1,
          explanation: "Ribosomes are the sites of protein synthesis in cells",
        },
        // Cameroon History - Secondary
        {
          subject: "Cameroon History",
          question: "What was Cameroon called during German colonization?",
          options: ["French Cameroon", "British Cameroons", "Kamerun", "Cameroun"],
          correct: 2,
          explanation: "Germany called it 'Kamerun' from 1884 to 1916",
        },
      ],
    },
    fr: {
      title: "Défi des Connaissances Étudiantes",
      subtitle: "Testez vos connaissances dans différentes matières",
      questionCounter: "Question",
      of: "sur",
      score: "Score",
      explanation: "Explication",
      nextQuestion: "Question Suivante",
      seeResults: "Voir les Résultats",
      completed: "Quiz Terminé !",
      successRate: "% Taux de Réussite",
      level: "Niveau",
      shareResults: "Partager les Résultats sur WhatsApp",
      restart: "Recommencer le Quiz",
      selectLevel: "Choisissez Votre Niveau",
      primary: "Primaire",
      secondary: "Secondaire",
      levels: {
        beginner: "Débutant",
        intermediate: "Intermédiaire",
        expert: "Expert",
      },
      primaryQuestions: [
        // Math - Primaire
        {
          subject: "Mathématiques",
          question: "Combien font 15 + 27 ?",
          options: ["40", "42", "44", "46"],
          correct: 1,
          explanation: "15 + 27 = 42",
        },
        // French - Primaire
        {
          subject: "Français",
          question: "Quel est le pluriel correct de 'chat' ?",
          options: ["chats", "chates", "chat", "chatss"],
          correct: 0,
          explanation: "Le pluriel de 'chat' est 'chats'",
        },
        // English - Primaire
        {
          subject: "Anglais",
          question: "Quel est le passé de 'go' en anglais ?",
          options: ["goed", "went", "gone", "going"],
          correct: 1,
          explanation: "Le passé de 'go' est 'went'",
        },
        // Science - Primaire
        {
          subject: "Sciences",
          question: "Combien de pattes a une araignée ?",
          options: ["6", "8", "10", "12"],
          correct: 1,
          explanation: "Les araignées ont 8 pattes",
        },
        // Geography - Primaire
        {
          subject: "Géographie",
          question: "Quelle est la capitale du Cameroun ?",
          options: ["Douala", "Yaoundé", "Bafoussam", "Garoua"],
          correct: 1,
          explanation: "Yaoundé est la capitale du Cameroun",
        },
      ],
      secondaryQuestions: [
        // Math - Secondaire
        {
          subject: "Mathématiques",
          question: "Résolvez : 3x + 5 = 17",
          options: ["x = 4", "x = 5", "x = 6", "x = 7"],
          correct: 0,
          explanation: "3x + 5 = 17 → 3x = 12 → x = 4",
        },
        // Physics - Secondaire
        {
          subject: "Physique",
          question: "Quelle formule représente la deuxième loi de Newton ?",
          options: ["F = ma", "P = mv", "E = mc²", "V = IR"],
          correct: 0,
          explanation: "La deuxième loi de Newton : Force = masse × accélération",
        },
        // Chemistry - Secondaire
        {
          subject: "Chimie",
          question: "Quel type de réaction est : 2H₂ + O₂ → 2H₂O ?",
          options: ["Combinaison", "Décomposition", "Déplacement", "Double déplacement"],
          correct: 0,
          explanation: "Deux éléments se combinent pour former un seul composé",
        },
        // Biology - Secondaire
        {
          subject: "Biologie",
          question: "Quel organite est responsable de la synthèse des protéines ?",
          options: ["Mitochondrie", "Ribosome", "Noyau", "Appareil de Golgi"],
          correct: 1,
          explanation: "Les ribosomes sont les sites de synthèse des protéines dans les cellules",
        },
        // Cameroon History - Secondaire
        {
          subject: "Histoire du Cameroun",
          question: "Comment s'appelait le Cameroun pendant la colonisation allemande ?",
          options: ["Cameroun français", "Cameroun britannique", "Kamerun", "Cameroun"],
          correct: 2,
          explanation: "L'Allemagne l'appelait 'Kamerun' de 1884 à 1916",
        },
      ],
    },
  }

  const content = quizContent[language]
  const questions = selectedLevel === "primary" ? content.primaryQuestions : content.secondaryQuestions

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return

    setSelectedAnswer(answerIndex)
    setShowResult(true)

    if (answerIndex === questions[currentQuestion].correct) {
      setScore(score + 1)
    }
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const shareOnWhatsApp = () => {
    const percentage = Math.round((score / questions.length) * 100)
    const levelText = selectedLevel === "primary" ? content.primary : content.secondary
    const message = encodeURIComponent(
      language === "en"
        ? `I took the ${levelText} knowledge quiz and scored ${score}/${questions.length} (${percentage}%). I want to learn more to do better!`
        : `J'ai passé le quiz de connaissances ${levelText} et j'ai obtenu ${score}/${questions.length} (${percentage}%). Je veux en savoir plus pour m'améliorer !`,
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank")
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setQuizCompleted(false)
    setSelectedLevel(null)
  }

  // Level Selection Screen
  if (!selectedLevel) {
    return (
      <section id="quiz" className="py-12 md:py-16 px-4 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex justify-center items-center mb-4">
                <Brain className="h-10 w-10 md:h-12 md:w-12 text-emerald-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                {content.title}
              </h2>
              <p className="text-lg md:text-xl text-gray-600 mb-6">{content.subtitle}</p>
              <p className="text-md md:text-lg text-gray-700">{content.selectLevel}</p>
            </motion.div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center">
            <motion.button
              onClick={() => setSelectedLevel("primary")}
              className="w-full md:w-72 bg-gradient-to-br from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center space-y-2">
                <GraduationCap className="w-8 h-8 md:w-10 md:h-10" />
                <span>{content.primary}</span>
                <span className="text-sm opacity-90">{language === "en" ? "Classes 1-6" : "SIL - CM2"}</span>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setSelectedLevel("secondary")}
              className="w-full md:w-72 bg-gradient-to-br from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center space-y-2">
                <Book className="w-8 h-8 md:w-10 md:h-10" />
                <span>{content.secondary}</span>
                <span className="text-sm opacity-90">
                  {language === "en" ? "Form 1 - Uppersixth" : "6ème - Terminale"}
                </span>
              </div>
            </motion.button>
          </div>
        </div>
      </section>
    )
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100)
    let level = content.levels.beginner
    let levelColor = "text-orange-500"

    if (percentage >= 80) {
      level = content.levels.expert
      levelColor = "text-green-500"
    } else if (percentage >= 60) {
      level = content.levels.intermediate
      levelColor = "text-blue-500"
    }

    return (
      <section id="quiz" className="py-12 md:py-16 px-4 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
        <div className="max-w-md mx-auto">
          <motion.div
            className="bg-white rounded-xl shadow-lg p-6 md:p-8"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-center mb-6">
              <Trophy className="h-14 w-14 text-yellow-500 animate-bounce" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
              {content.completed}
            </h2>

            <div className="text-center mb-6">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                {score}/{questions.length}
              </div>
              <div className="text-xl md:text-2xl text-gray-600 mb-3">
                {percentage}% {language === "en" ? "correct" : "correctes"}
              </div>
              <div className={`text-xl font-semibold ${levelColor} mb-2`}>
                {content.level}: {level}
              </div>
              <div className="text-gray-600">{selectedLevel === "primary" ? content.primary : content.secondary}</div>
            </div>

            <div className="space-y-3">
              <button
                onClick={shareOnWhatsApp}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{content.shareResults}</span>
              </button>

              <button
                onClick={restartQuiz}
                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-lg font-medium transition-all duration-300"
              >
                {content.restart}
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id="quiz" className="py-12 md:py-16 px-4 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center items-center mb-3">
            <Brain className="h-8 w-8 md:h-10 md:w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-3">
            {content.title}
          </h2>
          <span className="inline-block bg-gradient-to-r from-green-100 to-blue-100 px-3 py-1 rounded-full text-sm md:text-base font-medium">
            {selectedLevel === "primary" ? content.primary : content.secondary}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-200 h-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs md:text-sm text-gray-500">
                {content.questionCounter} {currentQuestion + 1} {content.of} {questions.length}
              </div>
              <div className="text-xs md:text-sm text-gray-500">
                {content.score}:{" "}
                <span className="font-medium">
                  {score}/{currentQuestion + (showResult ? 1 : 0)}
                </span>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 px-2 py-1 rounded-full text-xs md:text-sm font-medium">
                {questions[currentQuestion].subject}
              </div>
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">{questions[currentQuestion].question}</h3>

            <div className="space-y-3 mb-6">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={`w-full p-3 md:p-4 text-left rounded-lg border-2 transition-all duration-200 flex items-center ${
                    showResult
                      ? index === questions[currentQuestion].correct
                        ? "border-green-500 bg-green-50 text-green-700"
                        : index === selectedAnswer
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 bg-gray-50 text-gray-500"
                      : selectedAnswer === index
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-gray-300 mr-3 flex-shrink-0 flex items-center justify-center text-xs md:text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1 text-sm md:text-base">{option}</div>
                  {showResult && index === questions[currentQuestion].correct && (
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500 ml-2 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {showResult && (
              <div className="mb-6 p-3 md:p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <h4 className="font-semibold text-blue-700 text-sm md:text-base mb-1">{content.explanation}</h4>
                <p className="text-gray-700 text-sm md:text-base">{questions[currentQuestion].explanation}</p>
              </div>
            )}

            {showResult && (
              <button
                onClick={nextQuestion}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-md"
              >
                {currentQuestion < questions.length - 1 ? content.nextQuestion : content.seeResults}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// Enhanced Loading Component
const EnhancedLoadingCard = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-green-100">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      <div className="absolute top-2 left-2 w-16 h-6 bg-blue-200 rounded-full"></div>
      <div className="absolute top-2 right-2 w-12 h-6 bg-yellow-200 rounded-full"></div>
    </div>
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-3/4 bg-gradient-to-r from-blue-200 to-green-200 rounded animate-pulse"></div>
      </div>
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-200 rounded"></div>
          <div className="h-4 w-full bg-gradient-to-r from-green-200 to-blue-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-200 rounded"></div>
          <div className="h-4 w-full bg-gradient-to-r from-blue-200 to-green-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg animate-pulse"></div>
        <div className="h-10 flex-1 bg-gradient-to-r from-green-200 to-green-300 rounded-lg animate-pulse"></div>
      </div>
    </div>
  </div>
)

// Home Component
export default function Home() {
  const { language } = useTranslation()
  const navigate = useNavigate()
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [currentTeacherIndex, setCurrentTeacherIndex] = useState(0)

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["approvedTeachers"],
    queryFn: () => getTeacher({ is_approved: true }),
  })

  const { data: companyInfo, isLoading: companyInfoLoading } = useQuery({
    queryKey: ["companyInfo"],
    queryFn: getCompanyInfo,
  })

  useEffect(() => {
    if (teachers.length > 0) {
      const interval = setInterval(() => {
        setCurrentTeacherIndex((prevIndex) => (prevIndex === teachers.length - 1 ? 0 : prevIndex + 1))
      }, 5000) // Change every 5 seconds

      return () => clearInterval(interval)
    }
  }, [teachers.length])

  const topTeachers = teachers?.slice(0, 10) || []

  const stats = [
    {
      id: 1,
      title: language === "en" ? "Qualified Teachers" : "Enseignants Qualifiés",
      value: "200+",
      icon: Users,
      path: "/teachers",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      id: 2,
      title: language === "en" ? "Students Helped" : "Élèves Aidés",
      value: "3K+",
      icon: GraduationCap,
      path: "/teachers",
      gradient: "from-green-500 to-green-600",
    },
    {
      id: 3,
      title: language === "en" ? "Success Rate" : "Taux de Réussite",
      value: "95.6%",
      icon: Award,
      path: "/teachers",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      id: 4,
      title: language === "en" ? "Years of Service" : "Années d'Expérience",
      value: "5+",
      icon: CalendarDays,
      path: "/teachers",
      gradient: "from-blue-600 to-indigo-600",
    },
  ]

  return (
    <div className="pt-20">
      {/* Hero Section */}
<section className="relative min-h-screen pt-6 pb-8 px-4 overflow-hidden">
  {/* Background */}
  <div className="absolute inset-0 overflow-hidden z-0">
    <div
      className="absolute inset-0 bg-[url('/3802031.jpg')] bg-cover bg-center bg-no-repeat opacity-60"
      style={{
        backgroundPosition: "center center",
        backgroundAttachment: "fixed",
      }}
    ></div>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-green-900/60 to-blue-900/80"></div>
  </div>

  {/* Content */}
  <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center text-white pt-16 sm:pt-20">
    {/* Top Row: Login Button */}
    <div className="absolute top-4 left-4 sm:left-6">
      <motion.button
        onClick={() => navigate("/login")}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <LogIn className="w-4 h-4" />
        {language === "en" ? "Student Login" : "Connexion Étudiant"}
      </motion.button>
    </div>

    {/* Brand Name */}
    <motion.h2
      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 uppercase tracking-wide drop-shadow-xl px-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 bg-clip-text text-transparent">SMARTGEN</span>{' '}
      <span className="bg-gradient-to-r from-green-400 via-green-600 to-green-400 bg-clip-text text-transparent">EDUCATION</span>
    </motion.h2>

    {/* Main Title - Updated text as requested */}
    <motion.h1
      className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 max-w-4xl leading-tight text-white px-4 text-center"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {language === 'en'
        ? 'Find Your Home Tutor'
        : 'Trouvez votre répétiteur à domicile avec SmartGen Education'}
    </motion.h1>

    {/* Description - Updated cities as requested */}
    <motion.p
      className="text-sm sm:text-base lg:text-lg text-blue-100 max-w-2xl mb-4 sm:mb-6 px-4 text-center leading-relaxed"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {language === 'en'
        ? 'Available in Yaoundé, Douala, Bafoussam, Garoua and across Cameroon'
        : "Disponible à Yaoundé, Douala, Bafoussam, Garoua et partout au Cameroun"}
    </motion.p>

    {/* Stats */}
    <motion.div
      className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 max-w-6xl px-2 sm:px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.id}
          className="bg-white/15 backdrop-blur-sm border border-blue-400/20 rounded-xl p-3 sm:p-4 text-center cursor-pointer hover:bg-white/25 transition-all hover:border-blue-400/40"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 + index * 0.1 }}
          whileHover={{
            y: -4,
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2)',
          }}
          onClick={() => navigate(stat.path)}
        >
          <div className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 rounded-full bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-md`}>
            <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <p className="text-sm sm:text-base font-semibold text-white">{stat.value}</p>
          <p className="text-xs sm:text-sm text-blue-100/80 leading-tight">{stat.title}</p>
        </motion.div>
      ))}
    </motion.div>

    {/* CTA Buttons */}
    <motion.div
      className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <motion.button
        onClick={() => navigate("/teachers")}
        className="relative overflow-hidden group bg-gradient-to-br from-blue-500 via-blue-600 to-green-600 text-white px-6 py-3 rounded-full text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <Target className="w-4 h-4 sm:w-5 sm:h-5" />
          {language === "en" ? "Find Tutors" : "Trouver un tuteur"}
        </span>
        <span className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
      </motion.button>

      <motion.button
        onClick={() => navigate("/teacher-register")}
        className="relative overflow-hidden group bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white px-6 py-3 rounded-full text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <Users className="w-4 h-4 sm:w-5 sm:w-5" />
          {language === "en" ? "Become Tutor" : "Devenir tuteur"}
        </span>
        <span className="absolute inset-0 bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
      </motion.button>
    </motion.div>
  </div>
</section>

      {/* Top Teachers Section */}
      <section className="py-12 bg-gradient-to-br from-white via-blue-50/30 to-green-50/30">
  <div className="container mx-auto px-4 sm:px-6">
    {/* Section Header */}
    <motion.div
      className="text-center mb-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
        <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          {language === "en" ? "Our Top Teachers" : "Nos meilleurs enseignants"}
        </span>
      </h2>
      <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full"></div>
    </motion.div>

    {/* Loading State */}
    {isLoading ? (
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {[...Array(10)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse h-80"></div>
        ))}
      </div>
    ) : (
      <>
        {/* Teacher Cards Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {topTeachers.map((teacher: Teacher, index) => (
            <motion.div
              key={teacher.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100 relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Teacher Image with Zoom Effect */}
              <div className="relative h-40 sm:h-48 overflow-hidden">
                <img
                  src={`${teacher.profile_image_url || "https://i.imgur.com/N6APfZL.png"}?ts=${Date.now()}`}
                  alt={`${teacher.full_name}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                  onClick={() => setSelectedTeacher(teacher)}
                  loading="lazy"
                />

                {/* Click to Zoom Indicator */}
                <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <ZoomIn className="w-3 h-3" />
                  {language === "en" ? "Click to zoom" : "Cliquer pour agrandir"}
                </div>

                {/* Category Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
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

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center shadow-sm">
                  <Star className="text-yellow-500 mr-1" size={14} />
                  <span className="text-xs font-medium text-gray-700">{teacher.success_rate?.toFixed(1)}</span>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="p-4 sm:p-5">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-1">
                    {teacher.gender === "male" ? "Mr." : "Mme"} {teacher.full_name}
                  </h3>
                </div>

                <div className="space-y-2 mb-4">
                  {/* Subjects */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0">
                      <Book className="text-white" size={12} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 line-clamp-1">
                      {teacher.subjects?.slice(0, 2).join(", ")}
                      {teacher.subjects?.length > 2 && "..."}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="text-white" size={12} />
                    </div>
                    <div className="text-xs">
                      <p className="font-medium text-gray-800">
                        {teacher.town} - [{teacher.location?.slice(0, 1).join(", ")}
                        {teacher.location?.length > 1 && "..."}]
                      </p>
                    </div>
                  </div>
                </div>

                {/* View Profile Button - Modified for mobile */}
                <Link
                  to={`/teachers/${teacher.id}`}
                  className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-[1.02] text-center flex items-center justify-center gap-1"
                >
                  <ArrowRight size={14} className="animate-pulse hidden sm:inline" />
                  <span className="sm:hidden">Voir</span>
                  <span className="hidden sm:inline">
                    {language === "en" ? "View Profile" : "Voir le profil"}
                  </span>
                </Link>
              </div>
            </motion.div>
          ))}
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

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link
            to="/teachers"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Users size={18} />
            {language === "en" ? "View All Teachers" : "Voir tous les enseignants"}
          </Link>

          <Link
            to="/teacher-register"
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <GraduationCap size={18} />
            {language === "en" ? "Register as Teacher" : "S'inscrire en tant qu'enseignant"}
          </Link>
        </motion.div>
      </>
    )}
  </div>
</section>

      {/* About Section */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-blue-50/50">
        <div className="container-custom">
          {companyInfoLoading ? (
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="hidden md:block">
                <div className="w-full h-80 bg-gradient-to-br from-blue-200 to-green-200 rounded-lg shadow-lg animate-pulse"></div>
              </div>
              <div>
                <div className="h-10 w-3/4 bg-gradient-to-r from-blue-200 to-green-200 rounded mb-6 animate-pulse"></div>
                <div className="space-y-4 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-4 w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
                <div className="h-12 w-40 bg-gradient-to-r from-blue-200 to-green-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 gap-12 items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="hidden md:block">
                <img
                  src={companyInfo?.about_image1_url || "/placeholder.svg"}
                  alt="About SmartGen Educ"
                  className="rounded-xl shadow-xl w-full max-w-[500px] h-[300px] md:h-[400px] object-cover border-4 border-white"
                />
              </div>
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {language === "en" ? "About SmartGen Educ" : "À propos de SmartGen Educ"}
                  </span>
                </h2>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  {language === "en" ? companyInfo?.about_us_en : companyInfo?.about_us_fr}
                </p>
                <ul className="text-gray-700 space-y-3 mb-8">
                  {[
                    language === "en"
                      ? "Highly qualified and background-checked teachers."
                      : "Enseignants hautement qualifiés et vérifiés.",
                    language === "en"
                      ? "Personalized lessons tailored to your childs needs."
                      : "Cours personnalisés adaptés aux besoins de votre enfant.",
                    language === "en"
                      ? "Flexible scheduling – learn at your own pace and time."
                      : "Horaires flexibles – apprenez à votre propre rythme.",
                    language === "en"
                      ? `Available in major cities: ${companyInfo?.location}`
                      : `Disponible dans les grandes villes : ${companyInfo?.location}`,
                    language === "en"
                      ? "Affordable pricing with no compromise on quality."
                      : "Tarifs abordables sans compromis sur la qualité.",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/about"
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2 shadow-lg"
                >
                  {language === "en" ? "Learn More" : "En savoir plus"}
                  <ArrowRight size={20} />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Teacher Spotlight & Portal Section */}
     <section className="section-padding bg-blue">
  <div className="container-custom">
    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
      <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
        {language === "en" ? "Connect with teachers" : "Connexion avec les enseignants"}
      </span>
    </h2>

    {/* Reordered layout for mobile */}
    <div className="flex flex-col md:grid md:grid-cols-3 gap-6">
      {/* Teacher Portal - Moved to top on mobile */}
      <motion.div
        className="order-1 md:order-2 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow-lg p-5 border border-blue-100 flex flex-col justify-between h-full"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
      >
        <div>
          <h2 className="text-lg md:text-xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {language === "en" ? "For Teachers" : "Pour les Enseignants"}
            </span>
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            {language === "en"
              ? "Join our network of qualified educators and connect with students in need of your expertise. If you are a teacher, click on Sign Up to join. If you are already registered, log in to view or update your information and your students."
              : "Rejoignez notre réseau d'éducateurs qualifiés et connectez-vous avec des élèves ayant besoin de votre expertise. Si vous êtes enseignant, cliquez sur Inscription pour rejoindre. Et si vous êtes déjà enregistré, connectez-vous pour voir/modifier vos informations et vos élèves."}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/teacher-login"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-full py-2 rounded-lg font-medium text-sm"
          >
            <Users className="w-4 h-4" />
            {language === "en" ? "Teacher Login" : "Connexion Enseignant"}
          </Link>
          <Link
            to="/teacher-register"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white w-full py-2 rounded-lg font-medium text-sm"
          >
            <GraduationCap className="w-4 h-4" />
            {language === "en" ? "Register as Teacher" : "S'inscrire"}
          </Link>
        </div>
      </motion.div>

      {/* Teacher Carousel - Moved below on mobile */}
      <div className="order-2 md:order-1 md:col-span-2">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-green-50 p-4 shadow-lg h-full">
          {isLoading ? (
            <div className="bg-white rounded-lg p-6 shadow animate-pulse h-64 md:h-full"></div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 h-full flex flex-col">
              {teachers.length > 0 ? (
                teachers.map(
                  (teacher, index) =>
                    index === currentTeacherIndex && (
                      <Link to={`/teachers/${teacher.id}`} key={teacher.id} className="block h-full">
                        <motion.div
                          className="flex flex-col sm:flex-row gap-4 h-full"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: 1,
                            transition: { duration: 0.5 },
                          }}
                        >
                          {/* Image Left */}
                          <div className="flex-shrink-0 w-full sm:w-2/5 h-48 sm:h-auto relative">
                            <img
                              src={
                                teacher.profile_image_url ||
                                "https://i.imgur.com/N6APfZL.png" ||
                                "/placeholder.svg"
                              }
                              alt={teacher.full_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span>
                                {teacher.success_rate?.toFixed(1)} {language === "en" ? "Rating" : "Note"}
                              </span>
                            </div>
                          </div>

                          {/* Info Right */}
                          <div className="flex-1 p-3 flex flex-col justify-between">
                            {/* Teacher Info */}
                            <div>
                              {/* Name + Category */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                                  {teacher.gender === "male" ? "Mr." : "Mme"} {teacher.full_name}
                                </h3>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    teacher.category === "anglo"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-blue-100 text-blue-800"
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

                              {/* Location */}
                              <div className="text-l text-black-600 mb-2">
                                {teacher.town} - [{teacher.location?.join(", ")}]
                              </div>

                              {/* Subjects */}
                              <h4 className="font-semibold text-gray-700 text-xs mb-1">
                                {language === "en" ? "Subjects:" : "Matières:"}
                              </h4>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {teacher.subjects?.slice(0, 4).map((subject, i) => (
                                  <span
                                    key={i}
                                    className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
                                  >
                                    {subject}
                                  </span>
                                ))}
                              </div>

                              {/* About Me */}
                              {teacher.about_me && (
                                <div className="mb-3">
                                  <h4 className="font-semibold text-gray-700 text-xs mb-1">
                                    {language === "en" ? "About Me:" : "À propos de moi:"}
                                  </h4>
                                  <p className="text-xs text-gray-600">{teacher.about_me}</p>
                                </div>
                              )}
                            </div>

                            {/* Did You Know */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-3">
                              <h4 className="font-semibold text-blue-800 text-xs mb-1">
                                {language === "en" ? "Did You Know?" : "Le Saviez-Vous?"}
                              </h4>
                              <p className="text-gray-700 text-xs">
                                {language === "en"
                                  ? "We connect students with qualified home teachers across Cameroon."
                                  : "Nous connectons les élèves avec des enseignants qualifiés à travers le Cameroun."}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    ),
                )
              ) : (
                <div className="text-center p-6 text-gray-500 text-sm">
                  {language === "en" ? "No teachers available" : "Aucun enseignant disponible"}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-3">
            <button
              className="bg-white p-2 rounded-full shadow-md"
              onClick={() => setCurrentTeacherIndex((prev) => (prev === 0 ? teachers.length - 1 : prev - 1))}
            >
              <ArrowLeft className="w-5 h-5 text-blue-600" />
            </button>
            <button
              className="bg-white p-2 rounded-full shadow-md"
              onClick={() => setCurrentTeacherIndex((prev) => (prev === teachers.length - 1 ? 0 : prev + 1))}
            >
              <ArrowRight className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Interactive Quiz Section */}
      <QuizInteractif whatsappNumber={companyInfo?.whatsapp_number || "+237659827131"} language={language} />

<section className="py-12 px-4 sm:px-6 relative overflow-hidden">
  {/* Background with overlay - Modified for mobile visibility */}
  <div className="absolute inset-0 z-0">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-red-800/90"></div>
    <img
      src="/logofor.png"
      alt="FOROMAMED medical equipment background"
      className="w-full h-full object-cover object-center hidden sm:block" // Hide on mobile
      loading="eager" // Changed to eager for background
    />
  </div>

  <div className="max-w-7xl mx-auto relative z-10">
    <motion.div
      className="flex flex-col md:flex-row items-center gap-6 lg:gap-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 sm:p-8 hover:shadow-xl transition-all"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Logo Container - Enhanced for mobile */}
      <div className="flex-shrink-0 w-full md:w-auto flex justify-center">
        <div className="p-2 bg-white rounded-full shadow-lg border-4 border-blue-600">
          <img
            src="/logofor.png"
            className="h-20 w-20 sm:h-24 sm:w-24 object-contain" // Increased mobile size
            alt="FOROMAMED logo"
            loading="eager" // Changed to eager for logo
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-logo.png'; // Fallback
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
          {language === "en"
            ? "Medical Equipment & Healthcare Solutions"
            : "Équipements Médicaux & Solutions de Santé"}
          <span className="block bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
            (FOROMAMED)
          </span>
        </h2>

        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-3xl mx-auto md:mx-0">
          {language === "en"
            ? "Partnered with FOROMAMED - Leading provider of medical equipment, orthopedic supplies, and physiotherapy solutions in Cameroon. Quality healthcare equipment with professional installation."
            : "En partenariat avec FOROMAMED - Fournisseur leader d'équipements médicaux, d'articles orthopédiques et de solutions de physiothérapie au Cameroun. Équipements de santé de qualité avec installation professionnelle."}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 sm:gap-4">
          <a
            href="https://foromamed.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-lg transform hover:scale-105 text-sm sm:text-base"
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            {language === "en" ? "Visit Website" : "Visiter le Site"}
          </a>

          <a
            href="tel:+237655323333"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-blue-600 hover:text-red-600 transition-colors px-6 py-2 rounded-full shadow-sm border border-blue-200 hover:border-red-200 text-sm sm:text-base"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium">+237 655 323 333</span>
          </a>
        </div>
      </div>
    </motion.div>
  </div>
</section>

      {/* IT Services & Web Development Promotion */}
      <section className="section-padding bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container-custom">
          <motion.div
            className="max-w-4xl mx-auto p-8 rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-shadow border border-blue-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-xl font-bold shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <Phone size={24} />
                </motion.div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {language === "en" ? "Need a Professional Website?" : "Besoin d'un Site Web Professionnel?"}
                  </span>
                </h3>
                <p className="text-gray-600 mb-4">
                  {language === "en"
                    ? "We specialize in education platform development and IT consulting services"
                    : "Nous spécialisés dans les plateformes éducatives et conseils informatiques"}
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                  <a
                    href={`tel:+237652489073`}
                    className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-green-700 transition-all duration-300"
                  >
                    <span className="mr-2">📞</span>
                    +237 652 489 073
                  </a>
                  <span className="hidden sm:block text-gray-400">|</span>
                  <a
                    href={`https://wa.me/+237652489073`}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 rounded-full flex items-center gap-2 transition-all duration-300 transform hover:scale-105"
                  >
                    <span>{language === "en" ? "Chat Now" : "Discuter"}</span>
                    <ArrowRight size={18} />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
