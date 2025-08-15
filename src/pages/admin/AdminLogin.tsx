import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useQuery } from "@tanstack/react-query";
import { getCompanyInfo } from "../../lib/api";
import { useTranslation } from "../../context/TranslationContext";
import { ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);
  const { language } = useTranslation();

  const { data: companyInfo } = useQuery({
    queryKey: ["companyInfo"],
    queryFn: getCompanyInfo,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(identifier.toLowerCase(), password, true);
      toast.success(
        language === "en"
          ? "Successfully logged in!"
          : "Connexion réussie !"
      );
      navigate("/admin-dashboard");
    } catch (error) {
      toast.error(
        language === "en"
          ? "Invalid admin credentials"
          : "Identifiants administrateur invalides"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-green-500 relative px-4">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1350&q=80')",
        }}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-green-400 p-6 text-center">
          {companyInfo?.logo ? (
            <img
              src={companyInfo.logo}
              alt={companyInfo?.Name || "SmartGen Educ Logo"}
              className="h-16 mx-auto object-contain"
            />
          ) : (
            <div className="h-16 w-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
              {companyInfo?.Name?.charAt(0) || "S"}
            </div>
          )}
          <h2 className="mt-4 text-2xl font-bold text-white">
            {language === "en" ? "Admin Portal" : "Portail Administrateur"}
          </h2>
          <p className="text-sm text-white/90 mt-1">
            {language === "en"
              ? "Access your administrative dashboard"
              : "Accédez à votre tableau de bord administratif"}
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {language === "en"
                ? "Email or Username"
                : "Email ou Nom d'utilisateur"}
            </label>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                language === "en" ? "Enter your username" : "Entrez votre nom"
              }
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {language === "en" ? "Password" : "Mot de passe"}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                language === "en" ? "Enter your password" : "Entrez votre mot de passe"
              }
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 flex-1 py-3 px-4 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-400 transition"
            >
              <ArrowLeft size={18} />
              <span>{language === "en" ? "Home" : "Accueil"}</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 text-white font-medium bg-blue-500 rounded-lg shadow-md hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
            >
              {language === "en" ? "Sign In" : "Se connecter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
