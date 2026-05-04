/**
 * Data API functions — typed wrappers around axios for business endpoints.
 * All requests include the JWT access token via the api interceptor.
 */

import { api } from './api'

// ════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginatedData<T> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  [key: string]: unknown
}

// ── Student ────────────────────────────────────────────────────────

export interface Student {
  id: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  age?: number
  classroomId?: string
  classroom?: { id: string; name: string }
  isActive: boolean
  enrollmentDate: string
  parentId?: string
  parent?: { id: string; firstName: string; lastName: string }
  emergencyContact?: string
  medicalNotes?: string
  createdAt: string
  updatedAt: string
}

export interface TeacherStudent extends Student {
  areaProgress?: Record<string, number>
}

// ── Observation ─────────────────────────────────────────────────────

export interface MontessoriObservation {
  id: string
  studentId: string
  student?: { id: string; firstName: string; lastName: string }
  teacherId: string
  teacher?: { id: string; firstName: string; lastName: string }
  area: string
  subArea?: string
  title?: string
  description: string
  materials?: string
  notes?: string
  imageUrls: string[]
  status: 'DRAFT' | 'COMPLETED'
  isSharedWithParent: boolean
  createdAt: string
  updatedAt: string
}

// ── Communication ───────────────────────────────────────────────────

export interface Communication {
  id: string
  senderId: string
  sender?: { id: string; firstName: string; lastName: string }
  senderRole: string
  recipientType: string
  recipientId?: string
  subject: string
  body: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  isRead: boolean
  isAnnouncement: boolean
  attachments: string[]
  createdAt: string
  updatedAt: string
}

// ── Event ───────────────────────────────────────────────────────────

export interface Event {
  id: string
  title: string
  description?: string
  eventType: 'WORKSHOP' | 'MEETING' | 'ASSEMBLY' | 'CULTURAL' | 'SPORTS' | 'OTHER'
  startDate: string
  endDate: string
  location?: string
  isPublished: boolean
  maxAttendees?: number
  currentRegistrations: number
  organizerId: string
  organizer?: { id: string; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

// ── Attendance ──────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string
  studentId: string
  student?: { id: string; firstName: string; lastName: string }
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  checkInTime?: string
  checkOutTime?: string
  absenceReason?: string
  notedBy?: { id: string; firstName: string; lastName: string }
  createdAt: string
}

// ════════════════════════════════════════════════════════════════════
// Students API
// ════════════════════════════════════════════════════════════════════

export async function getStudents(params?: { classroomId?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedData<{ students: Student[] }>>> {
  const { data } = await api.get('/students', { params })
  return data
}

export async function getStudentById(id: string): Promise<ApiResponse<{ student: Student }>> {
  const { data } = await api.get(`/students/${id}`)
  return data
}

export async function getStudentObservations(studentId: string): Promise<ApiResponse<{ observations: MontessoriObservation[] }>> {
  const { data } = await api.get(`/observations/student/${studentId}`)
  return data
}

// ════════════════════════════════════════════════════════════════════
// Observations API
// ════════════════════════════════════════════════════════════════════

export async function getObservations(params?: { area?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedData<{ observations: MontessoriObservation[] }>>> {
  const { data } = await api.get('/observations', { params })
  return data
}

export async function getMyObservations(): Promise<ApiResponse<PaginatedData<{ observations: MontessoriObservation[] }>>> {
  const { data } = await api.get('/observations', { params: { limit: '10' } })
  return data
}

export async function getObservationStats(): Promise<ApiResponse<{ statistics: any }>> {
  const { data } = await api.get('/observations/stats')
  return data
}

// ════════════════════════════════════════════════════════════════════
// Communications API
// ════════════════════════════════════════════════════════════════════

export async function getMessages(params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedData<{ messages: Communication[] }>>> {
  const { data } = await api.get('/communications/messages', { params })
  return data
}

export async function getUnreadCount(): Promise<{ success: boolean; data: { count: number } }> {
  const { data } = await api.get('/communications/messages', { params: { unreadOnly: 'true', limit: '1' } })
  return { success: data.success, data: { count: data.data?.pagination?.total || 0 } }
}

export async function getAnnouncements(): Promise<ApiResponse<{ announcements: Communication[] }>> {
  const { data } = await api.get('/communications/announcements')
  return data
}

// ════════════════════════════════════════════════════════════════════
// Events API
// ════════════════════════════════════════════════════════════════════

export async function getEvents(params?: { eventType?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedData<{ events: Event[] }>>> {
  const { data } = await api.get('/events', { params })
  return data
}

export async function getUpcomingEvents(): Promise<ApiResponse<{ events: Event[] }>> {
  const { data } = await api.get('/events/upcoming')
  return data
}

// ════════════════════════════════════════════════════════════════════
// Attendance API
// ════════════════════════════════════════════════════════════════════

export async function getClassroomAttendance(classroomId: string, params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<{ students: any[]; attendance: AttendanceRecord[] }>> {
  const { data } = await api.get(`/attendance/classroom/${classroomId}`, { params })
  return data
}

export async function getAttendanceStats(params?: { classroomId?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
  const { data } = await api.get('/attendance/stats', { params })
  return data
}

// ════════════════════════════════════════════════════════════════════
// User/Profile API
// ════════════════════════════════════════════════════════════════════

export async function getMyStudents(): Promise<ApiResponse<{ students: Student[] }>> {
  const { data } = await api.get('/users/me/students')
  return data
}

export async function getMyChildren(): Promise<ApiResponse<{ students: Student[] }>> {
  const { data } = await api.get('/users/me/children')
  return data
}

export async function getMyClassrooms(): Promise<ApiResponse<{ classrooms: any[] }>> {
  const { data } = await api.get('/users/me/classrooms')
  return data
}
