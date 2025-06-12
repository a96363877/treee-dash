"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"

interface LoginFormData {
  email: string
  password: string
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password)
      router.push("/notifications")
    } catch (err) {
      setError("فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Logo/Brand section */}
      <div className="mb-6 relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-600/20 mb-4">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">تأمين تري</h1>
        <p className="text-gray-400 text-sm">لوحة التحكم</p>
      </div>

      <Card className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm border-gray-700/50 shadow-xl relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5"></div>

        <CardHeader className="space-y-1 text-center relative z-10">
          <CardTitle className="text-2xl font-bold text-white">تسجيل الدخول</CardTitle>
          <CardDescription className="text-gray-400">
            أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300 block">
                البريد الإلكتروني
              </label>
              <div className="relative group">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ادخل البريد الإلكتروني"
                  className="bg-gray-700/70 border-gray-600 text-white placeholder:text-gray-400 pr-4 pl-10 transition-all focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300 block">
                كلمة المرور
              </label>
              <div className="relative group">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="ادخل كلمة المرور"
                  className="bg-gray-700/70 border-gray-600 text-white placeholder:text-gray-400 pr-4 pl-10 transition-all focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-10 top-0 h-full px-2 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 rounded-md text-sm text-center animate-pulse">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className={cn(
                "w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium py-2 px-4 rounded-md transition-all duration-300 shadow-lg shadow-green-700/30 hover:shadow-green-700/50 flex items-center justify-center gap-2",
                isLoading && "opacity-70 cursor-not-allowed",
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-gray-400 text-xs relative z-10">
          جميع الحقوق محفوظة © {new Date().getFullYear()} تأمين تري
        </CardFooter>
      </Card>
    </div>
  )
}
