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
  StatArrow,
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
import DashboardLayout from '../../components/layout/DashboardLayout'
import { AddIcon, CalendarIcon, ChatIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'

const TeacherDashboard = () => {
  const { t } = useTranslation()
  const toast = useToast()

  // Mock data
  const classStats = {
    totalStudents: 24,
    presentToday: 22,
    observationsThisWeek: 18,
    pendingMessages: 3,
  }

  const montessoriAreas = [
    { name: 'Practical Life', progress: 85, color: 'green' },
    { name: 'Sensorial', progress: 72, color: 'blue' },
    { name: 'Language', progress: 68, color: 'purple' },
    { name: 'Mathematics', progress: 79, color: 'orange' },
    { name: 'Culture', progress: 63, color: 'red' },
  ]

  const recentObservations = [
    { id: 1, student: 'Thabo Molefe', area: 'Practical Life', date: 'Today', note: 'Mastered pouring water without spilling' },
    { id: 2, student: 'Lerato Ndlovu', area: 'Language', date: 'Yesterday', note: 'Started reading simple words' },
    { id: 3, student: 'Kagiso Botha', area: 'Mathematics', date: '2 days ago', note: 'Counting to 100 independently' },
    { id: 4, student: 'Naledi Smith', area: 'Sensorial', date: '3 days ago', note: 'Excellent color matching work' },
  ]

  const upcomingEvents = [
    { id: 1, title: 'Parent-Teacher Conference', date: 'Tomorrow', time: '14:00' },
    { id: 2, title: 'Montessori Workshop', date: 'Friday', time: '10:00' },
    { id: 3, title: 'School Assembly', date: 'Next Monday', time: '08:30' },
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
    // In real app, this would navigate to observation form
  }

  return (
    <DashboardLayout
      title="Teacher Dashboard"
      userRole="teacher"
      userName="Ms. Sarah Johnson"
      userEmail="sarah.johnson@montessori-mafikeng.edu.za"
    >
      <VStack spacing={6} align="stretch">
        {/* Welcome Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Good morning, Ms. Johnson! 👋
          </Heading>
          <Text color="gray.600">
            Here's what's happening in your Montessori classroom today.
          </Text>
        </Box>

        {/* Quick Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Students</StatLabel>
                <StatNumber>{classStats.totalStudents}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  2 new this term
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Present Today</StatLabel>
                <StatNumber>{classStats.presentToday}</StatNumber>
                <StatHelpText>
                  {classStats.totalStudents - classStats.presentToday} absent
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Observations</StatLabel>
                <StatNumber>{classStats.observationsThisWeek}</StatNumber>
                <StatHelpText>This week</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Messages</StatLabel>
                <StatNumber>{classStats.pendingMessages}</StatNumber>
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
                          {recentObservations.map((obs) => (
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
                          ))}
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
                      {upcomingEvents.map((event) => (
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
                      ))}
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
                        {Array.from({ length: classStats.totalStudents }).map((_, i) => (
                          <Avatar
                            key={i}
                            name={`Student ${i + 1}`}
                            src={`https://i.pravatar.cc/150?img=${i + 10}`}
                          />
                        ))}
                      </AvatarGroup>
                      
                      <Text fontSize="sm" color="gray.600" mt={3}>
                        {classStats.presentToday} of {classStats.totalStudents} students present today
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
                        <Text fontWeight="bold">3 unread messages</Text>
                        <Text fontSize="sm">
                          From parents of Thabo, Lerato, and Kagiso
                        </Text>
                        <Button
                          colorScheme="blue"
                          size="sm"
                          mt={2}
                          as={Link}
                          to="/messages"
                        >
                          View Messages
                        </Button>
                      </VStack>
                    </Box>
                    
                    <Text fontSize="sm" color="gray.600">
                      Last communication: Yesterday at 16:30
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
                      Synced 5 min ago
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