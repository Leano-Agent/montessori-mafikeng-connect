# Montessori Mafikeng Connect - Database Schema

## 📊 Overview

This document describes the PostgreSQL database schema for Montessori Mafikeng Connect. The schema is designed to support Montessori educational principles, African context requirements, and offline synchronization capabilities.

## 🗄️ Database Technology Stack

- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Migrations**: Prisma Migrate
- **Seeding**: Prisma Seed Scripts
- **Cache**: Redis 7+ (for sessions and rate limiting)

## 🔗 Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     User        │     │    Student      │     │   Classroom     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ email (UQ)      │     │ firstName       │     │ name            │
│ passwordHash    │     │ lastName        │     │ description     │
│ firstName       │     │ dateOfBirth     │     │ ageRange        │
│ lastName        │     │ gender          │     │ capacity        │
│ role            │     │ enrollmentDate  │     │ academicYear    │
│ phoneNumber     │     │ medicalNotes    │     │ teacherId (FK)  │
│ avatarUrl       │     │ specialNeeds    │     │ assistantId (FK)│
│ languagePref    │     │ classroomId (FK)│     │ createdById (FK)│
│ isActive        │     │ createdById (FK)│     │ createdAt       │
│ lastLoginAt     │     │ createdAt       │     │ updatedAt       │
│ createdAt       │     │ updatedAt       │     └─────────────────┘
│ updatedAt       │     └─────────────────┘              │
└─────────────────┘              │                       │
        │                        │                       │
        │                        ▼                       ▼
        │              ┌─────────────────┐     ┌─────────────────┐
        └──────────────│ StudentParent   │     │  Observation    │
                       ├─────────────────┤     ├─────────────────┤
                       │ id (PK)         │     │ id (PK)         │
                       │ studentId (FK)  │     │ studentId (FK)  │
                       │ parentId (FK)   │     │ observerId (FK) │
                       │ relationship    │     │ observationDate │
                       │ isPrimary       │     │ area            │
                       │ createdAt       │     │ activity        │
                       └─────────────────┘     │ description     │
                                               │ materialsUsed   │
                                               │ durationMinutes │
                                               │ notes           │
                                               │ photos          │
                                               │ tags            │
                                               │ createdAt       │
                                               │ updatedAt       │
                                               └─────────────────┘
```

## 📋 Complete Schema Definition

### User Model
Represents all users in the system (teachers, parents, administrators, principals).

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String
  firstName       String
  lastName        String
  role            UserRole  @default(PARENT)
  phoneNumber     String?
  avatarUrl       String?
  languagePref    Language  @default(SETSWANA)
  isActive        Boolean   @default(true)
  lastLoginAt     DateTime?
  refreshToken    String?
  resetToken      String?
  resetExpires    DateTime?
  
  // Relationships
  classrooms      Classroom[]  @relation("ClassroomTeacher")
  assistedClasses Classroom[]  @relation("ClassroomAssistant")
  createdStudents Student[]    @relation("StudentCreator")
  createdClasses  Classroom[]  @relation("ClassroomCreator")
  observations    Observation[]
  announcements   Announcement[]
  messagesSent    Message[]    @relation("MessageSender")
  messagesReceived Message[]   @relation("MessageReceiver")
  studentParents  StudentParent[]
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Indexes
  @@index([email])
  @@index([role])
  @@index([isActive])
}
```

### Student Model
Represents Montessori students with their personal and educational information.

```prisma
model Student {
  id              String    @id @default(uuid())
  firstName       String
  lastName        String
  dateOfBirth     DateTime
  gender          Gender
  enrollmentDate  DateTime  @default(now())
  medicalNotes    String?
  specialNeeds    String?
  isActive        Boolean   @default(true)
  
  // Relationships
  classroom       Classroom?   @relation(fields: [classroomId], references: [id])
  classroomId     String?
  parents         StudentParent[]
  observations    Observation[]
  attendance      AttendanceRecord[]
  progressReports ProgressReport[]
  createdBy       User        @relation("StudentCreator", fields: [createdById], references: [id])
  createdById     String
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Indexes
  @@index([firstName, lastName])
  @@index([classroomId])
  @@index([createdById])
}
```

### Classroom Model
Represents Montessori classrooms with mixed-age groupings.

```prisma
model Classroom {
  id              String    @id @default(uuid())
  name            String
  description     String?
  ageRange        String    // e.g., "3-6", "6-9", "9-12"
  capacity        Int       @default(25)
  academicYear    String    // e.g., "2024"
  isActive        Boolean   @default(true)
  
  // Relationships
  teacher         User?     @relation("ClassroomTeacher", fields: [teacherId], references: [id])
  teacherId       String?
  assistant       User?     @relation("ClassroomAssistant", fields: [assistantId], references: [id])
  assistantId     String?
  students        Student[]
  announcements   Announcement[]
  events          Event[]
  createdBy       User      @relation("ClassroomCreator", fields: [createdById], references: [id])
  createdById     String
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Indexes
  @@index([name])
  @@index([teacherId])
  @@index([academicYear])
  @@index([isActive])
}
```

### Observation Model
Core Montessori feature for documenting student observations.

```prisma
model Observation {
  id              String        @id @default(uuid())
  observationDate DateTime      @default(now())
  area            MontessoriArea
  activity        String
  description     String
  materialsUsed   String[]      // Array of materials used
  durationMinutes Int?
  notes           String?
  photos          String[]      // Array of S3 URLs
  tags            String[]      // Array of tags for categorization
  
  // Relationships
  student         Student       @relation(fields: [studentId], references: [id])
  studentId       String
  observer        User          @relation(fields: [observerId], references: [id])
  observerId      String
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Indexes
  @@index([studentId])
  @@index([observerId])
  @@index([observationDate])
  @@index([area])
  @@fulltext([description, notes, activity])
}
```

### StudentParent Model
Junction table for many-to-many relationship between students and parents.

```prisma
model StudentParent {
  id            String        @id @default(uuid())
  relationship  String        @default("Parent") // Parent, Guardian, etc.
  isPrimary     Boolean       @default(false)
  
  // Relationships
  student       Student       @relation(fields: [studentId], references: [id])
  studentId     String
  parent        User          @relation(fields: [parentId], references: [id])
  parentId      String
  
  // Timestamps
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  // Composite unique constraint
  @@unique([studentId, parentId])
  
  // Indexes
  @@index([studentId])
  @@index([parentId])
  @@index([isPrimary])
}
```

### Announcement Model
For school-wide or classroom-specific announcements.

```prisma
model Announcement {
  id              String        @id @default(uuid())
  title           String
  content         String
  priority        Priority      @default(MEDIUM)
  targetAudience  UserRole[]    // Array of roles
  sendSms         Boolean       @default(false)
  sendEmail       Boolean       @default(true)
  smsSent         Boolean       @default(false)
  emailSent       Boolean       @default(false)
  scheduledFor    DateTime?
  
  // Relationships
  author          User          @relation(fields: [authorId], references: [id])
  authorId        String
  classrooms      Classroom[]   @relation("AnnouncementClassrooms")
  attachments     Attachment[]
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  publishedAt     DateTime?
  
  // Indexes
  @@index([authorId])
  @@index([priority])
  @@index([scheduledFor])
  @@fulltext([title, content])
}
```

### Message Model
For direct messaging between users.

```prisma
model Message {
  id              String        @id @default(uuid())
  content         String
  isRead          Boolean       @default(false)
  attachments     String[]      // Array of S3 URLs
  
  // Relationships
  sender          User          @relation("MessageSender", fields: [senderId], references: [id])
  senderId        String
  receiver        User          @relation("MessageReceiver", fields: [receiverId], references: [id])
  receiverId      String
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  readAt          DateTime?
  
  // Indexes
  @@index([senderId])
  @@index([receiverId])
  @@index([createdAt])
  @@index([isRead])
}
```

### AttendanceRecord Model
For tracking student attendance with Montessori considerations.

```prisma
model AttendanceRecord {
  id              String        @id @default(uuid())
  date            DateTime      @default(now())
  status          AttendanceStatus @default(PRESENT)
  arrivalTime     String?       // Format: "HH:MM"
  departureTime   String?       // Format: "HH:MM"
  notes           String?
  
  // Relationships
  student         Student       @relation(fields: [studentId], references: [id])
  studentId       String
  recordedBy      User          @relation(fields: [recordedById], references: [id])
  recordedById    String
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Composite unique constraint
  @@unique([studentId, date])
  
  // Indexes
  @@index([studentId])
  @@index([date])
  @@index([status])
  @@index([recordedById])
}
```

### Event Model
For school events, parent meetings, holidays, etc.

```prisma
model Event {
  id              String        @id @default(uuid())
  title           String
  description     String?
  startDate       DateTime
  endDate         DateTime
  location        String?
  eventType       EventType
  targetAudience  UserRole[]
  volunteersNeeded Int          @default(0)
  rsvpRequired    Boolean      @default(false)
  
  // Relationships
  organizer       User          @relation(fields: [organizerId], references: [id])
  organizerId     String
  classrooms      Classroom[]   @relation("EventClassrooms")
  rsvps           RSVP[]
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Indexes
  @@index([organizerId])
  @@index([startDate])
  @@index([eventType])
  @@fulltext([title, description])
}
```

### ProgressReport Model
Montessori-style progress reports (not traditional report cards).

```prisma
model ProgressReport {
  id              String        @id @default(uuid())
  periodStart     DateTime
  periodEnd       DateTime
  reportType      ReportType    @default(QUARTERLY)
  strengths       String[]
  areasForGrowth  String[]
  recommendations String[]
  isPublished     Boolean       @default(false)
  
  // Relationships
  student         Student       @relation(fields: [studentId], references: [id])
  studentId       String
  preparedBy      User          @relation(fields: [preparedById], references: [id])
  preparedById    String
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  publishedAt     DateTime?
  
  // Indexes
  @@index([studentId])
  @@index([periodStart, periodEnd])
  @@index([preparedById])
  @@index([isPublished])
}
```

### Attachment Model
For file attachments across the system.

```prisma
model Attachment {
  id              String        @id @default(uuid())
  filename        String
  originalName    String
  mimeType        String
  size            Int           // Size in bytes
  url             String        // S3 URL
  key             String        // S3 key
  type            AttachmentType
  
  // Relationships
  announcement    Announcement? @relation(fields: [announcementId], references: [id])
  announcementId  String?
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  // Indexes
  @@index([announcementId])
  @@index([type])
}
```

### SyncQueue Model
For offline data synchronization.

```prisma
model SyncQueue {
  id              String        @id @default(uuid())
  entityType      String        // e.g., "Observation", "Attendance"
  entityId        String?
  operation       SyncOperation // CREATE, UPDATE, DELETE
  data            Json          // The entity data
  status          SyncStatus    @default(PENDING)
  retryCount      Int           @default(0)
  errorMessage    String?
  
  // Relationships
  user            User          @relation(fields: [userId], references: [id])
  userId          String
  
  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  syncedAt        DateTime?
  
  // Indexes
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([entityType, entityId])
}
```

## 🎯 Enums

### UserRole Enum
```prisma
enum UserRole {
  PARENT
  TEACHER
  ADMIN
  PRINCIPAL
}
```

### Language Enum
```prisma
enum Language {
  SETSWANA
  ENGLISH
}
```

### Gender Enum
```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}
```

### MontessoriArea Enum
```prisma
enum MontessoriArea {
  PRACTICAL_LIFE
  SENSORIAL
  LANGUAGE
  MATH
  CULTURAL
  ART
  MUSIC
  PEACE
}
```

### Priority Enum
```prisma
enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### AttendanceStatus Enum
```prisma
enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
  HALF_DAY
}
```

### EventType Enum
```prisma
enum EventType {
  SCHOOL_EVENT
  PARENT_MEETING
  HOLIDAY
  PROFESSIONAL_DEVELOPMENT
  COMMUNITY_EVENT
  OTHER
}
```

### ReportType Enum
```prisma
enum ReportType {
  WEEKLY
  MONTHLY
  QUARTERLY
  SEMESTER
  ANNUAL
  AD_HOC
}
```

### AttachmentType Enum
```prisma
enum AttachmentType {
  IMAGE
  DOCUMENT
  AUDIO
  VIDEO
  OTHER
}
```

### SyncOperation Enum
```prisma
enum SyncOperation {
  CREATE
  UPDATE
  DELETE
}
```

### SyncStatus Enum
```prisma
enum SyncStatus {
  PENDING
  SYNCING
  SYNCED
  FAILED
  CONFLICT
}
```

## 🔐 Security Considerations

### 1. Data Encryption
- Passwords: bcrypt with salt rounds 12
- Sensitive data: Encrypted at application level
- TLS: All database connections use SSL

### 2. Row-Level Security
```sql
-- Example: Parents can only see their own children
CREATE POLICY parent_student_policy ON student_parent
FOR SELECT USING (
  parent_id = current_user_id() OR
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = current_user_id() AND role IN ('TEACHER', 'ADMIN', 'PRINCIPAL')
  )
);
```

### 3. Audit Logging
All sensitive operations are logged to an audit table (not shown in main schema for simplicity).

## 📈 Performance Optimization

### 1. Indexes
- All foreign keys are indexed
- Frequently queried fields are indexed
- Composite indexes for common query patterns

### 2. Partitioning
Large tables (like observations and attendance) are partitioned by date:
```sql
-- Monthly partitioning for observations
CREATE TABLE observations_2024_01 PARTITION OF observations
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 3. Materialized Views
For frequently accessed aggregated data:
```sql
CREATE MATERIALIZED VIEW student_progress_summary AS
SELECT 
  student_id,
  COUNT(*) as observation_count,
  ARRAY_AGG(DISTINCT area) as areas_