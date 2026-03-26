import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  Progress,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { DownloadIcon, RefreshIcon, CheckIcon, WarningIcon } from '@chakra-ui/icons'

const MissionControl = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Phase 2 completion status
  const [phase2Progress, setPhase2Progress] = useState({
    authentication: 100,
    observationSystem: 85,
    communication: 80,
    offlineFirst: 70,
    setswanaIntegration: 95,
    missionControl: 100,
  })

  const [systemStatus, setSystemStatus] = useState({
    backend: 'operational',
    database: 'operational',
    frontend: 'operational',
    smsGateway: 'degraded',
    fileStorage: 'operational',
  })

  const [userStats, setUserStats] = useState({
    totalUsers: 142,
    activeToday: 89,
    teachers: 12,
    parents: 125,
    admins: 3,
    principals: 2,
  })

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, user: 'Ms. Sarah Johnson', action: 'Recorded observation', time: '10:30 AM', status: 'success' },
    { id: 2, user: 'James Molefe', action: 'Sent message', time: '11:15 AM', status: 'success' },
    { id: 3, user: 'System', action: 'Scheduled backup', time: '12:00 AM', status: 'success' },
    { id: 4, user: 'Mr. David Smith', action: 'Updated attendance', time: '08:45 AM', status: 'success' },
    { id: 5, user: 'Admin', action: 'Added new user', time: '09:20 AM', status: 'success' },
    { id: 6, user: 'SMS Gateway', action: 'Failed to send SMS', time: '10:05 AM', status: 'error' },
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const calculateOverallProgress = () => {
    const values = Object.values(phase2Progress)
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  const overallProgress = calculateOverallProgress()

  const progressItems = [
    { key: 'authentication', label: t('progress.authentication'), color: 'green', value: phase2Progress.authentication },
    { key: 'observationSystem', label: t('progress.observationSystem'), color: 'blue', value: phase2Progress.observationSystem },
    { key: 'communication', label: t('progress.communication'), color: 'purple', value: phase2Progress.communication },
    { key: 'offlineFirst', label: t('progress.offlineFirst'), color: 'orange', value: phase2Progress.offlineFirst },
    { key: 'setswanaIntegration', label: t('progress.setswanaIntegration'), color: 'red', value: phase2Progress.setswanaIntegration },
    { key: 'missionControl', label: t('progress.missionControl'), color: 'cyan', value: phase2Progress.missionControl },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'green'
      case 'degraded': return 'yellow'
      case 'down': return 'red'
      default: return 'gray'
    }
  }

  const handleRefresh = () => {
    toast({
      title: 'Refreshing data',
      description: 'Fetching latest system status...',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })

    // Simulate data refresh
    setTimeout(() => {
      toast({
        title: 'Data refreshed',
        description: 'System status updated successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }, 1500)
  }

  const handleExportReport = () => {
    toast({
      title: 'Exporting report',
      description: 'Generating and downloading mission control report...',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
              <Box>
                <Heading size="2xl" color="brand.600">
                  🚀 Mission Control
                </Heading>
                <Text fontSize="lg" color="gray.600">
                  Montessori Mafikeng Connect - Phase 2 Implementation Dashboard
                </Text>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Last updated: {currentTime.toLocaleDateString('en-ZA')} at {currentTime.toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                </Text>
              </Box>
              
              <HStack spacing={4}>
                <Button
                  leftIcon={<RefreshIcon />}
                  variant="outline"
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
                <Button
                  leftIcon={<DownloadIcon />}
                  colorScheme="brand"
                  onClick={handleExportReport}
                >
                  Export Report
                </Button>
              </HStack>
            </HStack>
          </Box>

          {/* System Status Alert */}
          <Alert
            status={systemStatus.smsGateway === 'degraded' ? 'warning' : 'success'}
            variant="subtle"
            borderRadius="lg"
          >
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>
                {systemStatus.smsGateway === 'degraded' ? 'Partial System Degradation' : 'All Systems Operational'}
              </AlertTitle>
              <AlertDescription>
                {systemStatus.smsGateway === 'degraded' 
                  ? 'SMS gateway is experiencing issues. Other systems are operational.'
                  : 'All systems are running normally.'
                }
              </AlertDescription>
            </Box>
            <Badge colorScheme={systemStatus.smsGateway === 'degraded' ? 'yellow' : 'green'} fontSize="md">
              {systemStatus.smsGateway === 'degraded' ? 'DEGRADED' : 'OPERATIONAL'}
            </Badge>
          </Alert>

          {/* Phase 2 Progress Overview */}
          <Card>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="lg" mb={2}>
                    Phase 2 Implementation Progress
                  </Heading>
                  <HStack spacing={4}>
                    <Progress 
                      value={overallProgress} 
                      size="lg" 
                      width="100%" 
                      colorScheme="brand" 
                      borderRadius="full"
                    />
                    <Text fontSize="xl" fontWeight="bold" minW="60px">
                      {overallProgress}%
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    Overall completion of Phase 2 frontend implementation
                  </Text>
                </Box>

                {/* Progress Details */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
                  {progressItems.map((item) => (
                    <GridItem key={item.key}>
                      <Box p={4} bg="white" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
                        <HStack justifyContent="space-between" mb={2}>
                          <Text fontWeight="bold">{item.label}</Text>
                          <Badge colorScheme={item.color}>{item.value}%</Badge>
                        </HStack>
                        <Progress 
                          value={item.value} 
                          colorScheme={item.color}
                          size="sm"
                          borderRadius="full"
                        />
                        {item.value === 100 && (
                          <HStack spacing={1} mt={2}>
                            <CheckIcon color="green.500" boxSize={3} />
                            <Text fontSize="xs" color="green.600">Complete</Text>
                          </HStack>
                        )}
                      </Box>
                    </GridItem>
                  ))}
                </Grid>
              </VStack>
            </CardBody>
          </Card>

          {/* System Status & User Stats */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* System Status */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">System Status</Heading>
                  
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Component</Th>
                          <Th>Status</Th>
                          <Th>Last Check</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {Object.entries(systemStatus).map(([key, status]) => (
                          <Tr key={key}>
                            <Td>
                              <Text textTransform="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(status)}>
                                {status.toUpperCase()}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontSize="sm">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  
                  <Text fontSize="sm" color="gray.600">
                    Monitoring AWS Africa (Cape Town) infrastructure
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* User Statistics */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">User Statistics</Heading>
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Total Users</StatLabel>
                      <StatNumber>{userStats.totalUsers}</StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        12% this month
                      </StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>Active Today</StatLabel>
                      <StatNumber>{userStats.activeToday}</StatNumber>
                      <StatHelpText>
                        {Math.round((userStats.activeToday / userStats.totalUsers) * 100)}% of total
                      </StatHelpText>
                    </Stat>
                  </SimpleGrid>
                  
                  <Divider />
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                        {userStats.teachers}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Teachers</Text>
                    </Box>
                    
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {userStats.parents}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Parents</Text>
                    </Box>
                    
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                        {userStats.admins}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Admins</Text>
                    </Box>
                    
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                        {userStats.principals}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Principals</Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Recent Activity */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Recent Activity</Heading>
                
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>User</Th>
                        <Th>Action</Th>
                        <Th>Time</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {recentActivity.map((activity) => (
                        <Tr key={activity.id} _hover={{ bg: 'gray.50' }}>
                          <Td fontWeight="medium">{activity.user}</Td>
                          <Td>{activity.action}</Td>
                          <Td>{activity.time}</Td>
                          <Td>
                            <Badge colorScheme={activity.status === 'success' ? 'green' : 'red'}>
                              {activity.status === 'success' ? 'Success' : 'Error'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </VStack>
            </CardBody>
          </Card>

          {/* Implementation Details */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Frontend Features */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">✅ Implemented Frontend Features</Heading>
                  
                  <VStack spacing={2} align="stretch">
                    <HStack>
                      <CheckIcon color="green.500" />
                      <Text>Authentication UI (Login, Register, Forgot Password)</Text>
                    </HStack>
                    <HStack>
                      <CheckIcon color="green.500" />
                      <Text>Teacher Dashboard with Montessori tracking</Text>
                    </HStack>
                    <HStack>
                      <CheckIcon color="green.500" />
                      <Text>Parent Dashboard with child progress</Text>
                    </HStack>
                    <HStack>
                      <CheckIcon color="green.500" />
                      <Text>Observation entry form with voice/photo</Text>
                    </HStack>
                    <HStack>
                      <CheckIcon color="green.500" />
                      <Text>School-parent messaging interface</Text>
                    </HStack>
                    <HStack>
                      <CheckIcon color="green.500" />
                      <Text>Offline sync management</Text>
                    </HStack>
                    <HStack>
                      <CheckIcon color="green.500" />
                      <Text>Setswana/English language switching</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Pending Tasks */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">🔄 Remaining Tasks</Heading>
                  
                  <VStack spacing={2} align="stretch">
                    <HStack>
                      <WarningIcon color="orange.500" />
                      <Text>Admin dashboard implementation</Text>
                    </HStack>
                    <HStack>
                      <WarningIcon color="orange.500" />
                      <Text>Principal dashboard implementation</Text>
                    </HStack>
                    <HStack>
                      <WarningIcon color="orange.500" />
                      <Text>Advanced reporting and analytics</Text>
                    </HStack>
                    <HStack>
                      <WarningIcon color="orange.500" />
                      <Text>Push notification integration</Text>
                    </HStack>
                    <HStack>
                      <WarningIcon color="orange.500" />
                      <Text>Advanced offline conflict resolution</Text>
                    </HStack>
                    <HStack>
                      <WarningIcon color="orange.500" />
                      <Text>Performance optimization</Text>
                    </HStack>
                  </VStack>
                  
                  <Box pt={4}>
                    <Text fontSize="sm" color="gray.600">
                      Estimated completion: 2-3 weeks
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* African Sovereignty Focus */}
          <Card bg="brand.50" borderColor="brand.200">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="lg" color="brand.700">
                  🦁 African Tech Sovereignty Achievement
                </Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>✅ Achieved:</Text>
                    <VStack spacing={2} align="stretch">
                      <HStack>
                        <CheckIcon color="green.500" />
                        <Text>Setswana as default language</Text>
                      </HStack>
                      <HStack>
                        <CheckIcon color="green.500" />
                        <Text>African design aesthetics</Text>
                      </HStack>
                      <HStack>
                        <CheckIcon color="green.500" />
                        <Text>Mobile-first PWA design</Text>
                      </HStack>
                      <HStack>
                        <CheckIcon color="green.500" />
                        <Text>Offline-first architecture</Text>
                      </HStack>
                      <HStack>
                        <CheckIcon color="green.500" />
                        <Text>SMS fallback for low-tech users</Text>
                      </HStack>
                    </VStack>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>🎯 Impact:</Text>
                    <VStack spacing={2} align="stretch">
                      <HStack>
                        <Box>🌍</Box>
                        <Text>Built entirely with African context in mind</Text>
                      </HStack>
                      <HStack>
                        <Box>💰</Box>
                        <Text>Cost-optimized for African school budgets</Text>
                      </HStack>
                      <HStack>
                        <Box>📱</Box>
                        <Text>Works on low-end smartphones</Text>
                      </HStack>
                      <HStack>
                        <Box>🔒</Box>
                        <Text>Data sovereignty with AWS Africa</Text>
                      </HStack>
                    </VStack>
                  </Box>
                </SimpleGrid>
                
                <HStack spacing={4} flexWrap="wrap" pt={4}>
                  <Badge colorScheme="green" fontSize="sm">AWS Africa (Cape Town)</Badge>
                  <Badge colorScheme="blue" fontSize="sm">Setswana First</Badge>
                  <Badge colorScheme="purple" fontSize="sm">Offline-First</Badge>
                  <Badge colorScheme="orange" fontSize="sm">SMS Fallback</Badge>
                  <Badge colorScheme="red" fontSize="sm">Cost-Optimized</Badge>
                  <Badge colorScheme="cyan" fontSize="sm">PWA</Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Footer */}
          <Box textAlign="center" pt={8} borderTopWidth="1px" borderTopColor="gray.200">
            <Text fontSize="sm" color="gray.500">
              Montessori Mafikeng Connect Phase 2 Frontend Implementation • Mission Control Dashboard
            </Text>
            <Text fontSize="xs" color="gray.400" mt={2}>
              Built with ❤️ in Africa, for Africa • Tyriie Solutions • {currentTime.getFullYear()}
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default MissionControl