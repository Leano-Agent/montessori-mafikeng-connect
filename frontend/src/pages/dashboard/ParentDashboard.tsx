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
  Flex,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { CalendarIcon, ChatIcon, DownloadIcon, PhoneIcon, ViewIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'

const ParentDashboard = () => {
  const { t } = useTranslation()
  const toast = useToast()

  // Mock data
  const children = [
    { id: 1, name: 'Thabo Molefe', age: 4, class: 'Mixed Age 3-6', teacher: 'Ms. Sarah Johnson' },
    { id: 2, name: 'Lerato Molefe', age: 6, class: 'Mixed Age 6-9', teacher: 'Mr. David Smith' },
  ]

  const recentUpdates = [
    { id: 1, child: 'Thabo Molefe', type: 'Observation', date: 'Today', details: 'Mastered pouring water in Practical Life area', area: 'Practical Life' },
    { id: 2, child: 'Lerato Molefe', type: 'Achievement', date: 'Yesterday', details: 'Started reading chapter books independently', area: 'Language' },
    { id: 3, child: 'Thabo Molefe', type: 'Photo', date: '2 days ago', details: 'Working with pink tower material', area: 'Sensorial' },
    { id: 4, child: 'Lerato Molefe', type: 'Observation', date: '3 days ago', details: 'Helping younger children with snack preparation', area: 'Practical Life' },
  ]

  const upcomingEvents = [
    { id: 1, title: 'Parent-Teacher Conference', date: 'Tomorrow', time: '14:00', child: 'Thabo' },
    { id: 2, title: 'School Cultural Day', date: 'Friday', time: '09:00', child: 'Both' },
    { id: 3, title: 'Montessori Workshop for Parents', date: 'Next Monday', time: '18:00', child: 'Parents' },
  ]

  const montessoriProgress = [
    { area: 'Practical Life', progress: 85, color: 'green' },
    { area: 'Sensorial', progress: 72, color: 'blue' },
    { area: 'Language', progress: 90, color: 'purple' },
    { area: 'Mathematics', progress: 68, color: 'orange' },
    { area: 'Culture', progress: 79, color: 'red' },
  ]

  const quickActions = [
    { label: 'Message Teacher', icon: '💬', path: '/messages/new', color: 'blue' },
    { label: 'View Progress', icon: '📈', path: '/progress', color: 'green' },
    { label: 'School Calendar', icon: '📅', path: '/calendar', color: 'purple' },
    { label: 'Announcements', icon: '📢', path: '/announcements', color: 'orange' },
  ]

  const handleVoiceMessage = () => {
    toast({
      title: 'Voice message ready',
      description: 'Voice interface activated. Speak your message...',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <DashboardLayout
      title="Parent Dashboard"
      userRole="parent"
      userName="Mr. James Molefe"
      userEmail="james.molefe@example.com"
    >
      <VStack spacing={6} align="stretch">
        {/* Welcome Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Welcome back, Mr. Molefe! 👋
          </Heading>
          <Text color="gray.600">
            Stay connected with your children's Montessori journey.
          </Text>
        </Box>

        {/* Children Overview */}
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
                          Age {child.age} • {child.class}
                        </Text>
                      </Box>
                    </HStack>
                    <Badge colorScheme="blue">{child.teacher}</Badge>
                  </HStack>

                  <SimpleGrid columns={2} spacing={3}>
                    <Box textAlign="center">
                      <Text fontSize="sm" color="gray.600">Observations</Text>
                      <Text fontSize="xl" fontWeight="bold">12</Text>
                      <Text fontSize="xs" color="green.600">This month</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="sm" color="gray.600">Messages</Text>
                      <Text fontSize="xl" fontWeight="bold">3</Text>
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
                          {recentUpdates.map((update) => (
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
                                  <Badge fontSize="xs" colorScheme="gray" mt={1}>
                                    {update.area}
                                  </Badge>
                                </Box>
                              </Td>
                            </Tr>
                          ))}
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

              {/* Photo Gallery */}
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

                    {/* Voice Message Button */}
                    <Button
                      leftIcon={<PhoneIcon />}
                      colorScheme="green"
                      onClick={handleVoiceMessage}
                      mt={2}
                    >
                      Send Voice Message
                    </Button>
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
                              <Text fontSize="xs" color="blue.600">
                                {event.child}
                              </Text>
                            </Box>
                            <Badge colorScheme="blue">Reminder</Badge>
                          </HStack>
                        </Box>
                      ))}
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
                          <StatNumber>8</StatNumber>
                          <StatHelpText>This month</StatHelpText>
                        </Stat>
                      </Box>
                      <Box textAlign="center">
                        <Stat>
                          <StatLabel>Response Time</StatLabel>
                          <StatNumber>4h</StatNumber>
                          <StatHelpText>Average</StatHelpText>
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
                    <Heading size="sm">SMS Notifications Active</Heading>
                    <Text fontSize="sm">
                      Critical updates are sent via SMS to +27 83 123 4567
                    </Text>
                    <Badge colorScheme="green" fontSize="xs">
                      Last SMS: Today 08:30
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
                    <Button
                      variant="outline"
                      colorScheme="brand"
                      size="xs"
                    >
                      Ke batla go bua ka Setswana
                    </Button>
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