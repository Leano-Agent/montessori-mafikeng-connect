import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useColorMode,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Stack,
  Badge,
} from '@chakra-ui/react'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  HamburgerIcon, 
  ChevronDownIcon, 
  SunIcon, 
  MoonIcon,
  BellIcon,
  SettingsIcon,
  UnlockIcon,
  AtSignIcon,
} from '@chakra-ui/icons'
import LanguageSwitcher from '../LanguageSwitcher'
import OfflineIndicator from '../OfflineIndicator'
import { Link, useNavigate } from 'react-router-dom'

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  userRole: 'teacher' | 'parent' | 'admin' | 'principal'
  userName: string
  userEmail: string
}

const DashboardLayout = ({ children, title, userRole, userName, userEmail }: DashboardLayoutProps) => {
  const { t } = useTranslation()
  const { colorMode, toggleColorMode } = useColorMode()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  const roleBadgeColors = {
    teacher: 'blue',
    parent: 'green',
    admin: 'purple',
    principal: 'orange',
  }

  const roleLabels = {
    teacher: t('auth.teacher'),
    parent: t('auth.parent'),
    admin: t('auth.admin'),
    principal: t('auth.principal'),
  }

  const handleLogout = () => {
    // In a real app, this would clear tokens and call logout API
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  const navItems = {
    teacher: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'My Class', path: '/class', icon: '👨‍🎓' },
      { label: 'Observations', path: '/observations', icon: '📝' },
      { label: 'Messages', path: '/messages', icon: '💬' },
      { label: 'Materials', path: '/materials', icon: '🧩' },
      { label: 'Reports', path: '/reports', icon: '📈' },
    ],
    parent: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'My Children', path: '/children', icon: '👨‍👧‍👦' },
      { label: 'Progress', path: '/progress', icon: '📈' },
      { label: 'Messages', path: '/messages', icon: '💬' },
      { label: 'Announcements', path: '/announcements', icon: '📢' },
      { label: 'Events', path: '/events', icon: '📅' },
    ],
    admin: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'Users', path: '/users', icon: '👥' },
      { label: 'Analytics', path: '/analytics', icon: '📈' },
      { label: 'Settings', path: '/settings', icon: '⚙️' },
      { label: 'Reports', path: '/reports', icon: '📋' },
      { label: 'System', path: '/system', icon: '🖥️' },
    ],
    principal: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'Teachers', path: '/teachers', icon: '👨‍🏫' },
      { label: 'School Overview', path: '/overview', icon: '🏫' },
      { label: 'Analytics', path: '/analytics', icon: '📈' },
      { label: 'Announcements', path: '/announcements', icon: '📢' },
      { label: 'Reports', path: '/reports', icon: '📋' },
    ],
  }

  return (
    <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      {/* Top Navigation Bar */}
      <Box
        bg="white"
        borderBottomWidth="1px"
        borderBottomColor="gray.200"
        px={6}
        py={4}
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow="sm"
      >
        <Flex alignItems="center" justifyContent="space-between">
          {/* Left: Menu button and title */}
          <HStack spacing={4}>
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon />}
              variant="ghost"
              onClick={onOpen}
              display={{ base: 'flex', md: 'none' }}
            />
            
            <HStack spacing={3}>
              <Box fontSize="2rem">🦁</Box>
              <Box>
                <Heading size="md" color="brand.600">
                  Montessori Connect
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  {title}
                </Text>
              </Box>
            </HStack>
          </HStack>

          {/* Right: User controls */}
          <HStack spacing={4}>
            <OfflineIndicator />
            <LanguageSwitcher />
            
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              variant="ghost"
              onClick={toggleColorMode}
            />
            
            <IconButton
              aria-label="Notifications"
              icon={<BellIcon />}
              variant="ghost"
              position="relative"
            >
              <Badge
                colorScheme="red"
                borderRadius="full"
                position="absolute"
                top={1}
                right={1}
                fontSize="xs"
                px={1}
              >
                3
              </Badge>
            </IconButton>

            {/* User menu */}
            <Menu>
              <MenuButton>
                <HStack spacing={2}>
                  <Avatar size="sm" name={userName} bg="brand.500" color="white" />
                  <Box display={{ base: 'none', md: 'block' }}>
                    <Text fontWeight="medium">{userName}</Text>
                    <Text fontSize="sm" color="gray.600">
                      <Badge colorScheme={roleBadgeColors[userRole]} fontSize="xs">
                        {roleLabels[userRole]}
                      </Badge>
                    </Text>
                  </Box>
                  <ChevronDownIcon />
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<AtSignIcon />} as={Link} to="/profile">
                  {t('auth.profile')}
                </MenuItem>
                <MenuItem icon={<SettingsIcon />} as={Link} to="/settings">
                  Settings
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<UnlockIcon />} onClick={handleLogout} color="red.500">
                  {t('auth.logout')}
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Main Content */}
      <Flex>
        {/* Sidebar for desktop */}
        <Box
          width={{ base: '0', md: '250px' }}
          bg="white"
          borderRightWidth="1px"
          borderRightColor="gray.200"
          minH="calc(100vh - 73px)"
          display={{ base: 'none', md: 'block' }}
          position="sticky"
          top="73px"
        >
          <VStack spacing={1} align="stretch" p={4}>
            {navItems[userRole].map((item) => (
              <Box
                key={item.path}
                as={Link}
                to={item.path}
                p={3}
                borderRadius="lg"
                _hover={{ bg: 'brand.50', color: 'brand.700' }}
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Box fontSize="lg">{item.icon}</Box>
                  <Text fontWeight="medium">{item.label}</Text>
                </HStack>
              </Box>
            ))}
          </VStack>

          {/* African Sovereignty Badge */}
          <Box p={4} mt={8} bg="brand.50" borderRadius="lg" borderWidth="1px" borderColor="brand.200">
            <VStack spacing={2} align="center" textAlign="center">
              <Text fontSize="sm" fontWeight="bold" color="brand.700">
                🦁 African Tech Sovereignty
              </Text>
              <Text fontSize="xs" color="brand.600">
                Built in Africa, for Africa
              </Text>
            </VStack>
          </Box>
        </Box>

        {/* Main content area */}
        <Box flex={1} p={{ base: 4, md: 6 }}>
          {children}
        </Box>
      </Flex>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <HStack spacing={3}>
              <Avatar size="sm" name={userName} bg="brand.500" color="white" />
              <Box>
                <Text fontWeight="bold">{userName}</Text>
                <Badge colorScheme={roleBadgeColors[userRole]} fontSize="xs">
                  {roleLabels[userRole]}
                </Badge>
              </Box>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={1} align="stretch">
              {navItems[userRole].map((item) => (
                <Box
                  key={item.path}
                  as={Link}
                  to={item.path}
                  p={3}
                  borderRadius="lg"
                  _hover={{ bg: 'brand.50', color: 'brand.700' }}
                  transition="all 0.2s"
                  onClick={onClose}
                >
                  <HStack spacing={3}>
                    <Box fontSize="lg">{item.icon}</Box>
                    <Text fontWeight="medium">{item.label}</Text>
                  </HStack>
                </Box>
              ))}
            </VStack>

            <Box mt={8} p={4} bg="brand.50" borderRadius="lg" borderWidth="1px" borderColor="brand.200">
              <VStack spacing={2} align="center" textAlign="center">
                <Text fontSize="sm" fontWeight="bold" color="brand.700">
                  🦁 African Tech Sovereignty
                </Text>
                <Text fontSize="xs" color="brand.600">
                  Built in Africa, for Africa
                </Text>
              </VStack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

export default DashboardLayout