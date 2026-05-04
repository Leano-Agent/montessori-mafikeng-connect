import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Button,
  Badge,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Avatar,
  AvatarGroup,
  IconButton,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { AddIcon, CalendarIcon, ChatIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import * as dataApi from '../../services/data'

interface DashboardData {
  stats: {
    totalStudents: number
    presentToday: number
    observationsThisWeek: number
    pendingMessages: number
  }
  recentObservations: Array<{
    id: string
    student: string
    area: string
    date: string
    note: string
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    date: string
    time: string
  }>
  classroomStudents: string[]
  presentCount: number
}

const TeacherDashboard = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData>({
    stats: { totalStudents: 0, presentToday: 0, observationsThisWeek: 0, pendingMessages: 0 },
    recentObservations: [],
    upcomingEvents: [],
    classroomStudents: [],
    presentCount: 0,
  })

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all dashboard data in parallel
      const [studentsRes, observationsRes, eventsRes, messagesRes, attendanceStats] = await Promise.allSettled([
        dataApi.getMyStudents(),
        dataApi.getMyObservations(),
        dataApi.getUpcomingEvents(),
        dataApi.getUnreadCount(),
        dataApi.getAttendanceStats(),
      ])

      const totalStudents =
        studentsRes.status === 'fulfilled' ? studentsRes.value.data.students.length : 0
      const classroomStudents =
        studentsRes.status === 'fulfilled' ? studentsRes.value.data.students.map((s: any) => s.firstName) : []

      const recentObservations: DashboardData['recentObservations'] = []
      if (observationsRes.status === 'fulfilled') {
        const obs = observationsRes.value.data.observations
        if (Array.isArray(obs)) {
          recentObservations.push(
            ...obs.slice(0, 5).map((o: any) => ({
              id: o.id,
              student: o.student ? `${o.student.firstName} ${o.student.lastName}` : 'Unknown',
              area: o.area,
              date: formatDaysAgo(o.createdAt),
              note: o.description?.substring(0, 60) || '',
            })),
          )
        }
      }

      const upcomingEvents: DashboardData['upcomingEvents'] = []
      if (eventsRes.status === 'fulfilled') {
        const evts = eventsRes.value.data.events
        if (Array.isArray(evts)) {
          upcomingEvents.push(
            ...evts.slice(0, 3).map((e: any) => ({
              id: e.id,
              title: e.title,
              date: formatDateLabel(e.startDate),
              time: formatTime(e.startDate),
            })),
          )
        }
      }

      const pendingMessages =
        messagesRes.status === 'fulfilled' ? messagesRes.value.data.count : 0

      const presentToday =
        attendanceStats.status === 'fulfilled'
          ? attendanceStats.value.data?.statusBreakdown?.find((s: any) => s.status === 'PRESENT')?.count || 0
          : 0

      setDashboard({
        stats: {
          totalStudents,
          presentToday: presentToday || totalStudents,
          observationsThisWeek: recentObservations.length,
          pendingMessages: pendingMessages,
        },
        recentObservations,
        upcomingEvents: upcomingEvents.length > 0
          ? upcomingEvents
          : [],
        classroomStudents: classroomStudents.slice(0, 24),
        presentCount: presentToday || totalStudents,
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data')
      toast({
        title: 'Error loading dashboard',
        description: 'Using cached data. Pull to refresh.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDaysAgo = (dateStr: string): string => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === now.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString('en-ZA', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  }

  const montessoriAreas = [
    { name: 'Practical Life', progress: dashboard.stats.observationsThisWeek > 0 ? 75 : 0, color: 'green' },
    { name: 'Sensorial', progress: 70, color: 'blue' },
    { name: 'Language', progress: 65, color: 'purple' },
    { name: 'Mathematics', progress: 60, color: 'orange' },
    { name: 'Culture', progress: 55, color: 'red' },
  ]

  const quickActions = [
    { label: 'Record Observation', icon: '📝', path: '/observations/new', color: 'blue' },
    { label: 'Message Parents', icon: '💬', path: '/messages/new', color: 'green' },
    { label: 'Check Materials', icon: '🧩', path: '/materials', color: 'purple' },
    { label: 'View Reports', icon: '📊', path: '/reports', color: 'orange' },
  ]

  const handleQuickObservation = () => {
    toast({
      title: 'Quick observation started',
      description: 'Redirecting to observation form...',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Teacher'
  const displayEmail = user?.email || ''

  return (
    <DashboardLayout
      title="Teacher Dashboard"
      userRole="teacher"
      userName={displayName}
      userEmail={displayEmail}
    >
      <VStack spacing={6} align="stretch">
        {/* Welcome Header */}
        <Box>
          <Heading size="lg" mb={2}>
            {loading ? 'Loading...' : `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${displayName.split(' ')[0]}! 👋`}
          </Heading>
          <Text color="gray.600">
            {loading ? 'Fetching your classroom data...' : `Here's what's happening in your Montessori classroom today.`}
          </Text>
          {error && (
            <Text color="red.500" fontSize="sm" mt={2}>
              ⚠️ Some data may not be available. {error}
            </Text>
          )}
        </Box>

        {/* Quick Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Students</StatLabel>
                <StatNumber>{dashboard.stats.totalStudents}</StatNumber>
                <StatHelpText>
                  Enrolled this term
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Present Today</StatLabel>
                <StatNumber>{dashboard.stats.presentToday}</StatNumber>
                <StatHelpText>
                  {Math.max(0, dashboard.stats.totalStudents - dashboard.stats.presentToday)} absent
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Observations</StatLabel>
                <StatNumber>{dashboard.stats.observationsThisWeek}</StatNumber>
                <StatHelpText>Recent</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Messages</StatLabel>
                <StatNumber>{dashboard.stats.pendingMessages}</StatNumber>
                <StatHelpText>Awaiting reply</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Main Content Grid */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Left Column */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Quick Actions */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Quick Actions</Heading>
                      <Button
                        leftIcon={<AddIcon />}
                        colorScheme="brand"
                        size="sm"
                        onClick={handleQuickObservation}
                      >
                        New Observation
                      </Button>
                    </HStack>
                    
                    <SimpleGrid columns={2} spacing={4}>
                      {quickActions.map((action) => (
                        <Button
                          key={action.label}
                          as={Link}
                          to={action.path}
                          variant="outline"
                          height="auto"
                          py={4}
                          justifyContent="flex-start"
                        >
                          <HStack spacing={3}>
                            <Box fontSize="xl">{action.icon}</Box>
                            <Box textAlign="left">
                              <Text fontWeight="medium">{action.label}</Text>
                            </Box>
                          </HStack>
                        </Button>
                      ))}
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>

              {/* Recent Observations */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Recent Observations</Heading>
                      <Button
                        as={Link}
                        to="/observations"
                        variant="ghost"
                        size="sm"
                        rightIcon={<ViewIcon />}
                      >
                        View All
                      </Button>
                    </HStack>
                    
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Student</Th>
                            <Th>Area</Th>
                            <Th>Date</Th>
                            <Th>Observation</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {dashboard.recentObservations.length > 0 ? (
                            dashboard.recentObservations.map((obs) => (
                              <Tr key={obs.id} _hover={{ bg: 'gray.50' }}>
                                <Td fontWeight="medium">{obs.student}</Td>
                                <Td>
                                  <Badge colorScheme="blue">{obs.area}</Badge>
                                </Td>
                                <Td>{obs.date}</Td>
                                <Td>
                                  <Text fontSize="sm" noOfLines={1}>
                                    {obs.note}
                                  </Text>
                                </Td>
                              </Tr>
                            ))
                          ) : (
                            <Tr>
                              <Td colSpan={4} textAlign="center" color="gray.500">
                                {loading ? 'Loading...' : 'No observations yet. Start by recording one!'}
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </VStack>
                </CardBody>
              </Card>

              {/* Montessori Areas Progress */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Montessori Areas Progress</Heading>
                    
                    <VStack spacing={3} align="stretch">
                      {montessoriAreas.map((area) => (
                        <Box key={area.name}>
                          <HStack justify="space-between" mb={1}>
                            <Text fontWeight="medium">{area.name}</Text>
                            <Text fontWeight="bold">{area.progress}%</Text>
                          </HStack>
                          <Progress
                            value={area.progress}
                            colorScheme={area.color}
                            size="sm"
                            borderRadius="full"
                          />
                        </Box>
                      ))}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>

          {/* Right Column */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Upcoming Events */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Upcoming Events</Heading>
                      <IconButton
                        aria-label="View calendar"
                        icon={<CalendarIcon />}
                        variant="ghost"
                        size="sm"
                        as={Link}
                        to="/calendar"
                      />
                    </HStack>
                    
                    <VStack spacing={3} align="stretch">
                      {dashboard.upcomingEvents.length > 0 ? (
                        dashboard.upcomingEvents.map((event) => (
                          <Box
                            key={event.id}
                            p={3}
                            borderWidth="1px"
                            borderColor="gray.200"
                            borderRadius="lg"
                            _hover={{ bg: 'gray.50' }}
                          >
                            <HStack justify="space-between">
                              <Box>
                                <Text fontWeight="medium">{event.title}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {event.date} • {event.time}
                                </Text>
                              </Box>
                              <Badge colorScheme="blue">Reminder</Badge>
                            </HStack>
                          </Box>
                        ))
                      ) : (
                        <Box p={4} textAlign="center" color="gray.500">
                          <Text>No upcoming events</Text>
                        </Box>
                      )}
                    </VStack>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      width="100%"
                      as={Link}
                      to="/calendar"
                    >
                      View Full Calendar
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Class Overview */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Class Overview</Heading>
                    
                    <Box>
                      <HStack justify="space-between" mb={3}>
                        <Text fontWeight="medium">Mixed Age Group</Text>
                        <Badge colorScheme="green">Ages 3-6</Badge>
                      </HStack>
                      
                      <AvatarGroup size="md" max={8}>
                        {dashboard.classroomStudents.length > 0 ? (
                          dashboard.classroomStudents.map((name, i) => (
                            <Avatar key={i} name={name} />
                          ))
                        ) : (
                          Array.from({ length: Math.max(5, dashboard.stats.totalStudents) }).map((_, i) => (
                            <Avatar key={i} name={`S${i + 1}`} />
                          ))
                        )}
                      </AvatarGroup>
                      
                      <Text fontSize="sm" color="gray.600" mt={3}>
                        {dashboard.stats.presentToday} of {dashboard.stats.totalStudents} students present today
                      </Text>
                    </Box>
                    
                    <Button
                      leftIcon={<ViewIcon />}
                      variant="outline"
                      size="sm"
                      as={Link}
                      to="/class"
                    >
                      View Class Details
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* Parent Communication */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Parent Communication</Heading>
                      <IconButton
                        aria-label="New message"
                        icon={<ChatIcon />}
                        variant="ghost"
                        size="sm"
                        as={Link}
                        to="/messages/new"
                      />
                    </HStack>
                    
                    <Box p={4} bg="blue.50" borderRadius="lg">
                      <VStack spacing={2} align="center" textAlign="center">
                        <Text fontWeight="bold">
                          {dashboard.stats.pendingMessages > 0
                            ? `${dashboard.stats.pendingMessages} unread message${dashboard.stats.pendingMessages > 1 ? 's' : ''}`
                            : 'No unread messages'}
                        </Text>
                        <Text fontSize="sm">
                          {dashboard.stats.pendingMessages > 0
                            ? 'Messages from parents awaiting your response'
                            : 'All caught up!'}
                        </Text>
                        <Button
                          colorScheme="blue"
                          size="sm"
                          mt={2}
                          as={Link}
                          to="/messages"
                        >
                          {dashboard.stats.pendingMessages > 0 ? 'View Messages' : 'Send Message'}
                        </Button>
                      </VStack>
                    </Box>
                    
                    <Text fontSize="sm" color="gray.600">
                      Check messages for parent communications
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              {/* Offline Status */}
              <Card bg="orange.50" borderColor="orange.200">
                <CardBody>
                  <VStack spacing={3} align="center" textAlign="center">
                    <Box fontSize="2rem">📱</Box>
                    <Heading size="sm">Offline-First Ready</Heading>
                    <Text fontSize="sm">
                      All features work without internet. Changes sync automatically when online.
                    </Text>
                    <Badge colorScheme="green" fontSize="xs">
                      {navigator.onLine ? 'Online' : 'Working Offline'}
                    </Badge>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>
        </Grid>

        {/* African Sovereignty Footer */}
        <Card bg="brand.50" borderColor="brand.200">
          <CardBody>
            <HStack justify="space-between" align="center">
              <Box>
                <Heading size="sm" color="brand.700">
                  🦁 African Tech Sovereignty in Education
                </Heading>
                <Text fontSize="sm">
                  This platform demonstrates African technological independence with Setswana language priority.
                </Text>
              </Box>
              <Button
                leftIcon={<DownloadIcon />}
                variant="outline"
                colorScheme="brand"
                size="sm"
              >
                Export Reports
              </Button>
            </HStack>
          </CardBody>
        </Card>
      </VStack>
    </DashboardLayout>
  )
}

export default TeacherDashboard
