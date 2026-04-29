# Montessori Mafikeng Connect - API Documentation

## 📋 Overview

This document provides comprehensive API documentation for the Montessori Mafikeng Connect backend API. The API follows RESTful principles and uses JSON for request/response payloads.

**Base URL**: `https://api.montessori-mafikeng.connect/api/v1` (Production)
**Development URL**: `http://localhost:3001/api/v1`

## 🔐 Authentication

### JWT Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Token Refresh
Access tokens expire after 15 minutes. Use the refresh token to obtain a new access token.

## 📊 API Endpoints

### Authentication Endpoints

#### POST `/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PARENT", // PARENT, TEACHER, ADMIN, PRINCIPAL
  "phoneNumber": "+27821234567"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PARENT",
      "phoneNumber": "+27821234567"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

#### POST `/auth/login`
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** Same as register endpoint.

#### POST `/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

#### POST `/auth/logout`
Invalidate refresh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Management Endpoints

#### GET `/users/me`
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PARENT",
      "phoneNumber": "+27821234567",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PUT `/users/me`
Update current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+27827654321"
}
```

**Response:** Updated user object.

#### GET `/users`
Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `role` (optional): Filter by role
- `search` (optional): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### Student Management Endpoints

#### POST `/students`
Create a new student (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "firstName": "Thabo",
  "lastName": "Mokoena",
  "dateOfBirth": "2018-05-15",
  "gender": "MALE", // MALE, FEMALE, OTHER
  "enrollmentDate": "2024-01-15",
  "classroomId": "uuid",
  "parentIds": ["uuid1", "uuid2"],
  "medicalNotes": "Allergic to peanuts",
  "specialNeeds": "None"
}
```

**Response:** Created student object.

#### GET `/students`
Get all students with filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `classroomId` (optional): Filter by classroom
- `parentId` (optional): Filter by parent
- `page`, `limit`, `search` (optional): Pagination and search

**Response:** Paginated list of students.

#### GET `/students/:id`
Get student by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** Student object with related data.

#### PUT `/students/:id`
Update student (Teacher/Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:** Partial student data.

**Response:** Updated student object.

### Classroom Management Endpoints

#### POST `/classrooms`
Create a new classroom (Admin/Principal only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Sunflower Class",
  "description": "Ages 3-6 mixed classroom",
  "ageRange": "3-6",
  "teacherId": "uuid",
  "assistantTeacherId": "uuid",
  "capacity": 25,
  "academicYear": "2024"
}
```

**Response:** Created classroom object.

#### GET `/classrooms`
Get all classrooms.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `teacherId` (optional): Filter by teacher
- `academicYear` (optional): Filter by academic year

**Response:** List of classrooms.

#### GET `/classrooms/:id`
Get classroom by ID with students and teacher.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** Classroom object with relationships.

### Observation Endpoints (Montessori Specific)

#### POST `/observations`
Create a Montessori observation (Teacher only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "studentId": "uuid",
  "observerId": "uuid",
  "observationDate": "2024-01-15",
  "area": "PRACTICAL_LIFE", // PRACTICAL_LIFE, SENSORIAL, LANGUAGE, MATH, CULTURAL
  "activity": "Pouring water",
  "description": "Successfully poured water without spilling",
  "materialsUsed": ["Pitcher", "Cups", "Tray"],
  "durationMinutes": 15,
  "notes": "Showed good concentration",
  "photos": ["url1", "url2"],
  "tags": ["concentration", "fine_motor"]
}
```

**Response:** Created observation object.

#### GET `/observations`
Get observations with filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `studentId` (optional): Filter by student
- `observerId` (optional): Filter by observer
- `area` (optional): Filter by Montessori area
- `startDate`, `endDate` (optional): Date range filter
- `page`, `limit` (optional): Pagination

**Response:** Paginated list of observations.

#### GET `/observations/:id`
Get observation by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** Observation object with details.

### Communication Endpoints

#### POST `/announcements`
Create announcement (Teacher/Admin/Principal only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Parent-Teacher Meeting",
  "content": "Monthly parent-teacher meeting scheduled for Friday",
  "priority": "HIGH", // LOW, MEDIUM, HIGH, URGENT
  "targetAudience": ["PARENTS", "TEACHERS"], // PARENTS, TEACHERS, STUDENTS, ALL
  "classroomIds": ["uuid1", "uuid2"],
  "sendSms": true,
  "sendEmail": true,
  "scheduledFor": "2024-01-20T18:00:00.000Z"
}
```

**Response:** Created announcement with delivery status.

#### GET `/announcements`
Get announcements for current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `priority` (optional): Filter by priority
- `startDate`, `endDate` (optional): Date range
- `unreadOnly` (optional): true/false

**Response:** List of announcements.

#### POST `/messages`
Send direct message.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "recipientId": "uuid",
  "content": "Hello, can we schedule a meeting?",
  "attachments": ["url1"]
}
```

**Response:** Created message with delivery status.

#### GET `/messages`
Get conversation threads.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `userId` (optional): Filter by specific user
- `unreadOnly` (optional): true/false

**Response:** List of conversation threads.

### Attendance Endpoints

#### POST `/attendance`
Record attendance (Teacher only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "classroomId": "uuid",
  "records": [
    {
      "studentId": "uuid1",
      "status": "PRESENT", // PRESENT, ABSENT, LATE, EXCUSED
      "arrivalTime": "08:15",
      "departureTime": "14:30",
      "notes": "Arrived late due to traffic"
    }
  ]
}
```

**Response:** Created attendance record.

#### GET `/attendance`
Get attendance records.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `studentId` (optional): Filter by student
- `classroomId` (optional): Filter by classroom
- `startDate`, `endDate` (optional): Date range
- `status` (optional): Filter by status

**Response:** List of attendance records.

### Calendar & Events Endpoints

#### POST `/events`
Create school event.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Sports Day",
  "description": "Annual school sports day",
  "startDate": "2024-02-10T09:00:00.000Z",
  "endDate": "2024-02-10T15:00:00.000Z",
  "location": "School Field",
  "eventType": "SCHOOL_EVENT", // SCHOOL_EVENT, PARENT_MEETING, HOLIDAY, OTHER
  "targetAudience": ["PARENTS", "STUDENTS", "TEACHERS"],
  "classroomIds": ["uuid1"],
  "volunteersNeeded": 5,
  "rsvpRequired": true
}
```

**Response:** Created event object.

#### GET `/events`
Get events with filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `startDate`, `endDate` (optional): Date range
- `eventType` (optional): Filter by type
- `classroomId` (optional): Filter by classroom

**Response:** List of events.

### File Upload Endpoints

#### POST `/upload`
Upload file (supports images, documents, audio).

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: The file to upload
- `type` (optional): PHOTO, DOCUMENT, AUDIO, OTHER
- `folder` (optional): observations, profiles, announcements

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/bucket/filename.jpg",
    "key": "folder/filename.jpg",
    "size": 1024,
    "type": "image/jpeg"
  }
}
```

## 🔧 Health & Monitoring Endpoints

#### GET `/health`
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "s3": "connected"
  }
}
```

#### GET `/metrics`
Get application metrics (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** System and application metrics.

## 📝 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing credentials
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: Third-party service error
- `RATE_LIMIT_EXCEEDED`: Too many requests

## 🔒 Rate Limiting

- **General endpoints**: 100 requests per minute per IP
- **Authentication endpoints**: 10 requests per minute per IP
- **File upload endpoints**: 20 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1610640000
```

## 🌐 WebSocket Events

The API supports real-time updates via WebSocket:

**Connection URL**: `wss://api.montessori-mafikeng.connect/ws`

### Events:
- `message:new` - New message received
- `announcement:new` - New announcement published
- `observation:added` - New observation added for student
- `attendance:updated` - Attendance record updated
- `event:reminder` - Upcoming event reminder

## 📱 SMS Integration

For users without reliable internet, critical notifications are sent via SMS using Africa's Talking API:

**SMS-triggered endpoints:**
- `POST /sms/receive` - Receive inbound SMS
- `POST /sms/send` - Send SMS (Admin/System only)

## 🔄 Offline Sync

The API supports offline data synchronization:

**Sync endpoints:**
- `POST /sync/push` - Push local changes
- `GET /sync/pull` - Pull server changes since last sync
- `GET /sync/conflicts` - Get sync conflicts

## 🛠️ Development & Testing

### Local Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Generate API documentation
npm run docs:generate
```

### API Testing Collection
Postman collection available at: `docs/postman-collection.json`

### Swagger Documentation
Interactive API docs available at: `/api-docs` when running locally

---

*Last Updated: March 27, 2026*