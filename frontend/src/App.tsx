import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Box, Container, Heading, Text, VStack, HStack, Progress, useColorMode, Grid, GridItem, Badge, Card, CardBody } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import OfflineIndicator from './components/OfflineIndicator'
import LanguageSwitcher from './components/LanguageSwitcher'

// Import pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import TeacherDashboard from './pages/dashboard/TeacherDashboard'
import ParentDashboard from './pages/dashboard/ParentDashboard'
import MissionControl from './pages/MissionControl'

function HomePage() {
  const { t } = useTranslation()
  const { colorMode } = useColorMode()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Phase 2 progress data - Updated to reflect current implementation
  const [phase2Progress] = useState({
    authentication: 100, // Complete: Login, Register, Forgot Password pages
    observationSystem: 85, // Observation form with voice/photo, dashboard integration
    communication: 80, // Messaging interface, parent-teacher communication
    offlineFirst: 70, // Sync manager, offline detection, local storage
    setswanaIntegration: 95, // Full i18n with Setswana as default
    missionControl: 100, // Complete mission control dashboard
  })

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

  return (
    <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={4}>
            <Box>
              <Heading size="2xl" color="brand.600">
                🦁 Montessori Mafikeng Connect
              </Heading>
              <Text fontSize="lg" color="gray.600">
                {t('welcome.subtitle')} - <Badge colorScheme="green" fontSize="md">Phase 2 Implementation</Badge>
              </Text>
            </Box>
            <HStack spacing={4}>
              <LanguageSwitcher />
              <OfflineIndicator />
            </HStack>
          </Box>

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
                    Last updated: {currentTime.toLocaleDateString('en-ZA', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} at {currentTime.toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                  </Text>
                </Box>

                {/* Progress Details */}
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
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
                      </Box>
                    </GridItem>
                  ))}
                </Grid>

                {/* Quick Access Buttons */}
                <Box pt={4} borderTopWidth="1px" borderTopColor="gray.200">
                  <Heading size="md" mb={4}>Quick Access</Heading>
                  <HStack spacing={4} flexWrap="wrap">
                    <a href="/login">
                      <Badge colorScheme="green" fontSize="md" p={2} cursor="pointer" _hover={{ bg: 'green.100' }}>
                        👤 Login
                      </Badge>
                    </a>
                    <a href="/register">
                      <Badge colorScheme="blue" fontSize="md" p={2} cursor="pointer" _hover={{ bg: 'blue.100' }}>
                        📝 Register
                      </Badge>
                    </a>
                    <a href="/dashboard">
                      <Badge colorScheme="purple" fontSize="md" p={2} cursor="pointer" _hover={{ bg: 'purple.100' }}>
                        📊 Teacher Dashboard
                      </Badge>
                    </a>
                    <a href="/parent-dashboard">
                      <Badge colorScheme="green" fontSize="md" p={2} cursor="pointer" _hover={{ bg: 'green.100' }}>
                        👨‍👩‍👧‍👦 Parent Dashboard
                      </Badge>
                    </a>
                    <a href="/mission-control">
                      <Badge colorScheme="orange" fontSize="md" p={2} cursor="pointer" _hover={{ bg: 'orange.100' }}>
                        🚀 Mission Control
                      </Badge>
                    </a>
                  </HStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Features Grid */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
            <GridItem>
              <Card height="100%">
                <CardBody>
                  <VStack spacing={3} align="center" textAlign="center">
                    <Box fontSize="3rem">🌍</Box>
                    <Heading size="md">African Sovereignty</Heading>
                    <Text fontSize="sm">Built in Africa, for Africa with Setswana language priority</Text>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card height="100%">
                <CardBody>
                  <VStack spacing={3} align="center" textAlign="center">
                    <Box fontSize="3rem">👨‍🏫</Box>
                    <Heading size="md">Montessori Philosophy</Heading>
                    <Text fontSize="sm">Observation-based assessment, mixed-age classrooms, work cycle tracking</Text>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card height="100%">
                <CardBody>
                  <VStack spacing={3} align="center" textAlign="center">
                    <Box fontSize="3rem">📱</Box>
                    <Heading size="md">Offline-First</Heading>
                    <Text fontSize="sm">Works without constant internet, automatic sync when online</Text>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card height="100%">
                <CardBody>
                  <VStack spacing={3} align="center" textAlign="center">
                    <Box fontSize="3rem">💬</Box>
                    <Heading size="md">SMS Integration</Heading>
                    <Text fontSize="sm">Critical notifications via SMS for low-tech users</Text>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>

          {/* Technical Status */}
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Technical Implementation Status</Heading>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  <GridItem>
                    <Box p={4} bg="green.50" borderRadius="md">
                      <Heading size="sm" mb={2}>✅ Backend API</Heading>
                      <Text fontSize="sm">Node.js + Express + Prisma + PostgreSQL</Text>
                      <Text fontSize="xs" color="green.600" mt={1}>• Authentication system complete</Text>
                      <Text fontSize="xs" color="green.600">• Observation API implemented</Text>
                      <Text fontSize="xs" color="green.600">• Communication system ready</Text>
                    </Box>
                  </GridItem>
                  
                  <GridItem>
                    <Box p={4} bg="blue.50" borderRadius="md">
                      <Heading size="sm" mb={2}>🚀 Frontend PWA</Heading>
                      <Text fontSize="sm">React 18 + TypeScript + Vite + Chakra UI</Text>
                      <Text fontSize="xs" color="blue.600" mt={1}>• African design theme applied</Text>
                      <Text fontSize="xs" color="blue.600">• Setswana/English i18n configured</Text>
                      <Text fontSize="xs" color="blue.600">• Offline detection active</Text>
                    </Box>
                  </GridItem>
                  
                  <GridItem>
                    <Box p={4} bg="purple.50" borderRadius="md">
                      <Heading size="sm" mb={2}>📊 Database Schema</Heading>
                      <Text fontSize="sm">PostgreSQL with Montessori-specific design</Text>
                      <Text fontSize="xs" color="purple.600" mt={1}>• Complete Prisma schema ready</Text>
                      <Text fontSize="xs" color="purple.600">• Sync queue for offline-first</Text>
                      <Text fontSize="xs" color="purple.600">• Audit logging implemented</Text>
                    </Box>
                  </GridItem>
                  
                  <GridItem>
                    <Box p={4} bg="orange.50" borderRadius="md">
                      <Heading size="sm" mb={2}>🔧 Development Tools</Heading>
                      <Text fontSize="sm">Complete development environment</Text>
                      <Text fontSize="xs" color="orange.600" mt={1}>• Automated setup scripts</Text>
                      <Text fontSize="xs" color="orange.600">• Docker configuration ready</Text>
                      <Text fontSize="xs" color="orange.600">• AWS Africa deployment plan</Text>
                    </Box>
                  </GridItem>
                </Grid>
              </VStack>
            </CardBody>
          </Card>

          {/* African Sovereignty Message */}
          <Card bg="brand.50" borderColor="brand.200">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="lg" color="brand.700">
                  🦁 African Tech Sovereignty in Education
                </Heading>
                <Text>
                  This project demonstrates that African technology solutions can be built with African context as the primary design constraint. 
                  We prioritize Setswana language, African hosting infrastructure, cultural relevance, and cost-effectiveness for African schools.
                </Text>
                <HStack spacing={4} flexWrap="wrap">
                  <Badge colorScheme="green" fontSize="sm">AWS Africa (Cape Town)</Badge>
                  <Badge colorScheme="blue" fontSize="sm">Setswana First</Badge>
                  <Badge colorScheme="purple" fontSize="sm">Offline-First</Badge>
                  <Badge colorScheme="orange" fontSize="sm">SMS Fallback</Badge>
                  <Badge colorScheme="red" fontSize="sm">Cost-Optimized</Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Footer */}
          <Box textAlign="center" pt={8} borderTopWidth="1px" borderTopColor="gray.200">
            <Text fontSize="sm" color="gray.500">
              Built with ❤️ in Africa, for Africa • Tyriie Solutions • Manifesting Africa's Future
            </Text>
            <Text fontSize="xs" color="gray.400" mt={2}>
              Montessori Mafikeng Connect v0.1.0 • Phase 2 Implementation • {currentTime.getFullYear()}
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<TeacherDashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/mission-control" element={<MissionControl />} />
        {/* Add more routes as we create more pages */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App