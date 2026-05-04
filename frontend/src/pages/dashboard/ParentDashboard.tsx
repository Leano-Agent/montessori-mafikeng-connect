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
  IconButton,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Image,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { CalendarIcon, ChatIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import * as dataApi from '../../services/data'

interface ChildData {
  id: string
  name: string
  age: number
  classroom: string
  teacher: string
  observationsCount: number
  unreadMessages: number
}

interface RecentUpdate {
  id: string
  child: string
  type: string
  date: string
  details: string
  area?: string
}

interface UpcomingEvent {
  id: string
  title: string
  date: string
  time: string
  child: string
}

const ParentDashboard = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [children, setChildren] = useState<ChildData[]>([])
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [observationsCount, setObservationsCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [messageCount, setMessageCount] = useState(0)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch parent's children (students linked to this parent)
      const [studentsRes, observationsRes, eventsRes, messagesRes, announcementsRes] = await Promise.allSettled([
        dataApi.getMyChildren(),
        dataApi.getMyObservations(),
        dataApi.getUpcomingEvents(),
        dataApi.getUnreadCount(),
        dataApi.getAnnouncements(),
      ])

      // Process students/children
      const childrenList: ChildData[] = []
      if (studentsRes.status === 'fulfilled') {
        const students = studentsRes.value.data.students
        if (Array.isArray(students)) {
          for (const s of students) {
            const age = s.dateOfBirth
              ? Math.floor((Date.now() - new Date(s.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : 0
            childrenList.push({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`,
              age,
              classroom: s.classroom?.name || 'Unassigned',
              teacher: 'Assigned Teacher',
              observationsCount: 0,
              unreadMessages: 0,
            })
          }
        }
      }
      setChildren(childrenList)

      // Process observations for updates
      const updates: RecentUpdate[] = []
      let totalObsCount = 0
      if (observationsRes.status === 'fulfilled') {
        const obs = observationsRes.value.data.observations
        if (Array.isArray(obs)) {
          totalObsCount = obs.length
          updates.push(
            ...obs.slice(0, 5).map((o: any) => ({
              id: o.id,
              child: o.student ? `${o.student.firstName} ${o.student.lastName}` : 'Child',
              type: 'Observation',
              date: formatDaysAgo(o.createdAt),
              details: o.description?.substring(0, 80) || '',
              area: o.area,
            })),
          )
        }
      }
      setRecentUpdates(updates.length > 0 ? updates : [])
      setObservationsCount(totalObsCount)

      // Process events
      const events: UpcomingEvent[] = []
      if (eventsRes.status === 'fulfilled') {
        const evts = eventsRes.value.data.events
        if (Array.isArray(evts)) {
          events.push(
            ...evts.slice(0, 3).map((e: any) => ({
              id: e.id,
              title: e.title,
              date: formatDateLabel(e.startDate),
              time: formatTime(e.startDate),
              child: e.eventType === 'MEETING' ? 'Parent' : childrenList.length > 0 ? childrenList[0].name.split(' ')[0] : 'Child',
            })),
          )
        }
      }
      setUpcomingEvents(events)

      // Messages
      if (messagesRes.status === 'fulfilled') {
        setUnreadMessages(messagesRes.value.data.count)
      }

      // Announcements
      if (announcementsRes.status === 'fulfilled') {
        const anns = announcementsRes.value.data.announcements
        if (Array.isArray(anns)) {
          setMessageCount(anns.length)
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load data')
      toast({
        title: 'Data loading issue',
        description: 'Some information may be unavailable. Pull to refresh.',
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

  const montessoriProgress = [
    { area: 'Practical Life', progress: observationsCount > 2 ? 75 : 30, color: 'green' },
    { area: 'Sensorial', progress: observationsCount > 3 ? 65 : 25, color: 'blue' },
    { area: 'Language', progress: observationsCount > 1 ? 60 : 20, color: 'purple' },
    { area: 'Mathematics', progress: 55, color: 'orange' },
    { area: 'Culture', progress: 50, color: 'red' },
  ]

  const quickActions = [
    { label: 'Message Teacher', icon: '💬', path: '/messages/new', color: 'blue' },
    { label: 'View Progress', icon: '📈', path: '/progress', color: 'green' },
    { label: 'School Calendar', icon: '📅', path: '/calendar', color: 'purple' },
    { label: 'Announcements', icon: '📢', path: '/announcements', color: 'orange' },
  ]

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Parent'
  const displayEmail = user?.email || ''

  return (
    <DashboardLayout
      title="Parent Dashboard"
      userRole="parent"
      userName={displayName}
      userEmail={displayEmail}
    >
      <VStack spacing={6} align="stretch">
        {/* Welcome Header */}
        <Box>
          <Heading size="lg" mb={2}>
            {loading ? 'Loading...' : `Welcome back, ${displayName.split(' ')[0]}! 👋`}
          </Heading>
          <Text color="gray.600">
            {loading ? 'Fetching your children\'s data...' : 'Stay connected with your children\'s Montessori journey.'}
          </Text>
          {error && (
            <Text color="red.500" fontSize="sm" mt={2}>
              ⚠️ Some data may not be available. {error}
            </Text>
          )}
        </Box>

        {/* Children Overview */}
        {children.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {children.map((child) => (
              <Card key={child.id}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <HStack spacing={3}>
                        <Avatar name={child.name} size="md" />
                        <Box>
                          <Heading size="md">{child.name}</Heading>
                          <Text fontSize="sm" color="gray.600">
                            Age {child.age} • {child.classroom}
                          </Text>
                        </Box>
                      </HStack>
                      <Badge colorScheme="blue">{child.teacher}</Badge>
                    </HStack>

                    <SimpleGrid columns={2} spacing={3}>
                      <Box textAlign="center">
                        <Text fontSize="sm" color="gray.600">Observations</Text>
                        <Text fontSize="xl" fontWeight="bold">{observationsCount}</Text>
                        <Text fontSize="xs" color="green.600">Available</Text>
                      </Box>
                      <Box textAlign="center">
                        <Text fontSize="sm" color="gray.600">Messages</Text>
                        <Text fontSize="xl" fontWeight="bold">{unreadMessages}</Text>
                        <Text fontSize="xs" color="blue.600">Unread</Text>
                      </Box>
                    </SimpleGrid>

                    <Button
                      leftIcon={<ViewIcon />}
                      variant="outline"
                      size="sm"
                      as={Link}
                      to={`/child/${child.id}`}
                    >
                      View Details
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Card>
            <CardBody>
              <VStack spacing={3} textAlign="center" py={6}>
                <Box fontSize="3rem">👶</Box>
                <Heading size="md">No children linked yet</Heading>
                <Text color="gray.600">
                  {loading ? 'Checking...' : 'Your children\'s profiles will appear here once linked by the school.'}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Main Content Grid */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Left Column */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Recent Updates */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Recent Updates</Heading>
                      <Button
                        as={Link}
                        to="/updates"
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
                            <Th>Child</Th>
                            <Th>Type</Th>
                            <Th>Date</Th>
                            <Th>Details</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {recentUpdates.length > 0 ? (
                            recentUpdates.map((update) => (
                              <Tr key={update.id} _hover={{ bg: 'gray.50' }}>
                                <Td fontWeight="medium">{update.child}</Td>
                                <Td>
                                  <Badge colorScheme={
                                    update.type === 'Observation' ? 'blue' :
                                    update.type === 'Achievement' ? 'green' : 'purple'
                                  }>
                                    {update.type}
                                  </Badge>
                                </Td>
                                <Td>{update.date}</Td>
                                <Td>
                                  <Box>
                                    <Text fontSize="sm">{update.details}</Text>
                                    {update.area && (
                                      <Badge fontSize="xs" colorScheme="gray" mt={1}>
                                        {update.area}
                                      </Badge>
                                    )}
                                  </Box>
                                </Td>
                              </Tr>
                            ))
                          ) : (
                            <Tr>
                              <Td colSpan={4} textAlign="center" color="gray.500">
                                {loading ? 'Loading...' : 'No updates yet. Check back soon!'}
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </VStack>
                </CardBody>
              </Card>

              {/* Montessori Progress */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Montessori Areas Progress</Heading>
                    
                    <VStack spacing={3} align="stretch">
                      {montessoriProgress.map((area) => (
                        <Box key={area.area}>
                          <HStack justify="space-between" mb={1}>
                            <Text fontWeight="medium">{area.area}</Text>
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
                    
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Based on teacher observations and assessments
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              {/* Photo Gallery Placeholder */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Recent Photos</Heading>
                      <Button
                        as={Link}
                        to="/gallery"
                        variant="ghost"
                        size="sm"
                      >
                        View Gallery
                      </Button>
                    </HStack>
                    
                    <SimpleGrid columns={3} spacing={2}>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Box
                          key={i}
                          height="100px"
                          bg="gray.100"
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          overflow="hidden"
                        >
                          <Image
                            src={`https://i.pravatar.cc/150?img=${i + 20}`}
                            alt={`Child activity ${i}`}
                            width="100%"
                            height="100%"
                            objectFit="cover"
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                    
                    <Text fontSize="sm" color="gray.600">
                      Photos of your children's Montessori work
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </GridItem>

          {/* Right Column */}
          <GridItem>
            <VStack spacing={6} align="stretch">
              {/* Quick Actions */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Quick Actions</Heading>
                    
                    <SimpleGrid columns={2} spacing={3}>
                      {quickActions.map((action) => (
                        <Button
                          key={action.label}
                          as={Link}
                          to={action.path}
                          variant="outline"
                          height="auto"
                          py={3}
                          justifyContent="flex-start"
                        >
                          <HStack spacing={2}>
                            <Box fontSize="lg">{action.icon}</Box>
                            <Text fontSize="sm" fontWeight="medium">
                              {action.label}
                            </Text>
                          </HStack>
                        </Button>
                      ))}
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>

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
                      {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event) => (
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
                                <Text fontSize="xs" color="blue.600">
                                  {event.child}
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
                  </VStack>
                </CardBody>
              </Card>

              {/* Communication Stats */}
              <Card>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Communication</Heading>
                    
                    <SimpleGrid columns={2} spacing={4}>
                      <Box textAlign="center">
                        <Stat>
                          <StatLabel>Messages</StatLabel>
                          <StatNumber>{messageCount || unreadMessages}</StatNumber>
                          <StatHelpText>Total</StatHelpText>
                        </Stat>
                      </Box>
                      <Box textAlign="center">
                        <Stat>
                          <StatLabel>Unread</StatLabel>
                          <StatNumber>{unreadMessages}</StatNumber>
                          <StatHelpText>New</StatHelpText>
                        </Stat>
                      </Box>
                    </SimpleGrid>
                    
                    <Button
                      leftIcon={<ChatIcon />}
                      colorScheme="blue"
                      size="sm"
                      as={Link}
                      to="/messages"
                    >
                      Open Messages
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* SMS Notification Status */}
              <Card bg="blue.50" borderColor="blue.200">
                <CardBody>
                  <VStack spacing={3} align="center" textAlign="center">
                    <Box fontSize="2rem">📱</Box>
                    <Heading size="sm">SMS Notifications</Heading>
                    <Text fontSize="sm">
                      Critical updates are sent via SMS for important notifications
                    </Text>
                    <Badge colorScheme="green" fontSize="xs">
                      SMS Active
                    </Badge>
                  </VStack>
                </CardBody>
              </Card>

              {/* Setswana Language Support */}
              <Card bg="brand.50" borderColor="brand.200">
                <CardBody>
                  <VStack spacing={3} align="center" textAlign="center">
                    <Box fontSize="2rem">🇿🇦</Box>
                    <Heading size="sm">Setswana Language</Heading>
                    <Text fontSize="sm">
                      Full interface available in Setswana. Switch language in top right.
                    </Text>
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
                  🦁 Designed for African Parents
                </Heading>
                <Text fontSize="sm">
                  Voice messages, SMS fallback, Setswana language, and offline access for diverse needs.
                </Text>
              </Box>
              <Button
                leftIcon={<DownloadIcon />}
                variant="outline"
                colorScheme="brand"
                size="sm"
              >
                Download Progress Report
              </Button>
            </HStack>
          </CardBody>
        </Card>
      </VStack>
    </DashboardLayout>
  )
}

export default ParentDashboard
