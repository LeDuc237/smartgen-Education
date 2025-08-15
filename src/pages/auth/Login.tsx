"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { useAuthStore } from "../../store/authStore"
import { getCompanyInfo } from "../../lib/api"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "../../context/TranslationContext"

export default function Login() {
  const [identifier, setIdentifier] = useState("")
  const [guardianName, setGuardianName] = useState("")
  const [fullName, setFullName] = useState("")
  const [loginMethod, setLoginMethod] = useState<"username" | "fullname">("username")
  const navigate = useNavigate()
  const { language } = useTranslation()
  const signIn = useAuthStore((state) => state.signIn)

  const { data: companyInfo } = useQuery({
    queryKey: ["companyInfo"],
    queryFn: getCompanyInfo,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const loginIdentifier = loginMethod === "username" ? identifier : fullName
      await signIn(loginIdentifier, guardianName)
      toast.success(language === "en" ? "Successfully logged in!" : "Connexion réussie !")
      navigate("/student-dashboard")
    } catch (error: any) {
      toast.error(
        error.message ||
          (language === "en"
            ? "Failed to login. Please check your credentials."
            : "Échec de la connexion. Veuillez vérifier vos informations."),
      )
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center pt-28 py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0, 123, 255, 0.15), rgba(40, 167, 69, 0.15)), url("https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80")',
      }}
    >
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-6">
          {companyInfo?.logo && (
            <img
              src={companyInfo.logo || "/placeholder.svg"}
              alt="Company Logo"
              className="h-16 mx-auto mb-2 object-contain"
            />
          )}
          <h1 className="text-xl font-bold text-gray-900">
            {companyInfo?.Name || (language === "en" ? "Our Company" : "Notre entreprise")}
          </h1>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800">
          {language === "en" ? "Student Login" : "Connexion Étudiant"}
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          {language === "en" ? "Access your student dashboard" : "Accédez à votre tableau de bord étudiant"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === "en" ? "Login Method" : "Méthode de connexion"}
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="username"
                  checked={loginMethod === "username"}
                  onChange={(e) => setLoginMethod(e.target.value as "username" | "fullname")}
                  className="mr-2"
                />
                <span className="text-sm">{language === "en" ? "Username" : "Nom d'utilisateur"}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fullname"
                  checked={loginMethod === "fullname"}
                  onChange={(e) => setLoginMethod(e.target.value as "username" | "fullname")}
                  className="mr-2"
                />
                <span className="text-sm">{language === "en" ? "Full Name" : "Nom complet"}</span>
              </label>
            </div>
          </div>

          {loginMethod === "username" ? (
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                {language === "en" ? "Student ID or Username" : "Identifiant ou nom d'utilisateur"}
              </label>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={
                  language === "en"
                    ? "Enter your username or student ID"
                    : "Entrez votre nom d'utilisateur ou ID étudiant"
                }
              />
            </div>
          ) : (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                {language === "en" ? "Full Name" : "Nom complet"}
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={language === "en" ? "Enter your full name" : "Entrez votre nom complet"}
              />
            </div>
          )}

          <div>
            <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700">
              {language === "en" ? "Guardian Name" : "Nom du responsable"}
            </label>
            <input
              id="guardianName"
              type="text"
              required
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={language === "en" ? "Enter guardian name" : "Entrez le nom du responsable"}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            {language === "en" ? "Sign In" : "Se connecter"}
          </button>

          <p className="text-center text-sm text-gray-600">
            <Link to="/" className="text-primary hover:underline">
              {language === "en" ? "← Back to Home" : "← Retour à l'accueil"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
