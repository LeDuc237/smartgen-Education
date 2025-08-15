import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCategoryInfo = (category: "franco" | "anglo" | "bilingue") => {
  const categoryMap = {
    anglo: {
      label: "Anglophone",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      gradient: "from-blue-500 to-blue-600",
      icon: "🇬🇧",
    },
    franco: {
      label: "Francophone",
      color: "bg-green-100 text-green-800 border-green-200",
      gradient: "from-green-500 to-green-600",
      icon: "🇫🇷",
    },
    bilingue: {
      label: "Bilingual",
      color: "bg-purple-100 text-purple-800 border-purple-200",
      gradient: "from-purple-500 to-purple-600",
      icon: "🌍",
    },
  }
  return (
    categoryMap[category] || {
      label: category,
      color: "bg-gray-100 text-gray-800 border-gray-200",
      gradient: "from-gray-500 to-gray-600",
      icon: "📚",
    }
  )
}
