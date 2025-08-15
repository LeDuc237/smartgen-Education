"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Calendar, User, Eye, ArrowRight, Search, BookOpen } from "lucide-react"
import { useTranslation } from "../context/TranslationContext"
import { getNotices } from "../lib/api"
import type { Notice } from "../lib/types"

export default function Blog() {
  const { language } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<"all" | "text" | "image" | "video" | "link">("all")

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: getNotices,
  })

  const filteredNotices = notices.filter((notice: Notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || notice.type === selectedType
    return matchesSearch && matchesType
  })

  const typeOptions = [
    { id: "all", label: { en: "All Posts", fr: "Tous les articles" } },
    { id: "text", label: { en: "Articles", fr: "Articles" } },
    { id: "image", label: { en: "Images", fr: "Images" } },
    { id: "video", label: { en: "Videos", fr: "Vidéos" } },
    { id: "link", label: { en: "Resources", fr: "Ressources" } },
  ]

  const LoadingCard = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )

  const BlogCard = ({ notice, index }: { notice: Notice; index: number }) => (
    <motion.article
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Content Preview */}
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-green-100 overflow-hidden">
        {notice.type === "image" && (
          <img
            src={notice.content || "/placeholder.svg"}
            alt={notice.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        {notice.type === "video" && (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-white text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Video Content</p>
            </div>
          </div>
        )}
        {(notice.type === "text" || notice.type === "link") && (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <div className="text-white text-center p-6">
              <BookOpen className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-bold line-clamp-2">{notice.title}</h3>
            </div>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-sm ${
              notice.type === "text"
                ? "bg-blue-600"
                : notice.type === "image"
                  ? "bg-green-600"
                  : notice.type === "video"
                    ? "bg-purple-600"
                    : "bg-orange-600"
            }`}
          >
            {notice.type === "text"
              ? language === "en"
                ? "Article"
                : "Article"
              : notice.type === "image"
                ? language === "en"
                  ? "Image"
                  : "Image"
                : notice.type === "video"
                  ? language === "en"
                    ? "Video"
                    : "Vidéo"
                  : language === "en"
                    ? "Resource"
                    : "Ressource"}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {notice.title}
        </h2>

        {notice.type === "text" && <p className="text-gray-600 mb-4 line-clamp-3">{notice.content}</p>}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(notice.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{language === "en" ? "SmartGen Educ" : "SmartGen Educ"}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-between items-center">
          {notice.type === "link" ? (
            <a
              href={notice.content}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              {language === "en" ? "View Resource" : "Voir la ressource"}
              <ArrowRight size={16} />
            </a>
          ) : notice.type === "video" ? (
            <a
              href={notice.content}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              {language === "en" ? "Watch Video" : "Regarder la vidéo"}
              <ArrowRight size={16} />
            </a>
          ) : (
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
              {language === "en" ? "Read More" : "Lire plus"}
              <ArrowRight size={16} />
            </button>
          )}

          <div className="flex items-center gap-1 text-gray-400">
            <Eye size={16} />
            <span className="text-sm">{Math.floor(Math.random() * 100) + 50}</span>
          </div>
        </div>
      </div>
    </motion.article>
  )

  return (
    <div className="min-h-screen bg-gray-50 pt-36 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            {language === "en" ? "Educational Blog" : "Blog Éducatif"}
          </h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === "en"
              ? "Stay updated with the latest educational content, tips, and resources"
              : "Restez informé avec les derniers contenus éducatifs, conseils et ressources"}
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder={
                  language === "en" ? "Search articles, resources..." : "Rechercher des articles, ressources..."
                }
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl 
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-500
                         placeholder-gray-400 text-gray-700 
                         transition-all duration-200 shadow-sm
                         hover:border-blue-200 pl-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-4 flex items-center">
                <Search className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Type Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {typeOptions.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  selectedType === type.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 shadow-md border border-gray-200"
                }`}
              >
                {language === "en" ? type.label.en : type.label.fr}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Blog Grid */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <LoadingCard key={index} />
              ))}
            </div>
          ) : filteredNotices.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-600 mb-2">
                {language === "en" ? "No posts found" : "Aucun article trouvé"}
              </h3>
              <p className="text-gray-500">
                {language === "en"
                  ? "Try adjusting your search or filters"
                  : "Essayez d'ajuster votre recherche ou vos filtres"}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotices.map((notice: Notice, index) => (
                <BlogCard key={notice.id} notice={notice} index={index} />
              ))}
            </div>
          )}
        </section>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {language === "en" ? "Want to contribute?" : "Vous voulez contribuer?"}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === "en"
                ? "Share your educational insights and help other students succeed"
                : "Partagez vos connaissances éducatives et aidez d'autres étudiants à réussir"}
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
              {language === "en" ? "Contact Us" : "Contactez-nous"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
