import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Progress,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Code,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  RepeatIcon, 
  CheckIcon, 
  WarningIcon, 
  DownloadIcon,
  AttachmentIcon,
  ViewIcon,
  CloseIcon,
} from '@chakra-ui/icons'

interface SyncItem {
  id: number
  type: 'observation' | 'message' | 'attendance' | 'profile'
  action: 'create' | 'update' | 'delete'
  description: string
  timestamp: string
  status: 'pending' | 'syncing' | 'completed' | 'failed'
  retries: number
  data: any
}

const SyncManager = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedItem, setSelectedItem] = useState<SyncItem | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)

  // Mock sync queue data
  const [syncQueue, setSyncQueue] = useState<SyncItem[]>([
    { id: 1, type: 'observation', action: 'create', description: 'Thabo - Practical Life observation', timestamp: '10:30 AM', status: 'pending', retries: 0, data: { student: 'Thabo Molefe', area: 'Practical Life' } },
    { id: 2, type: 'message', action: 'create', description: 'Message to Ms. Johnson', timestamp: '11:15 AM', status: 'pending', retries: 0, data: { recipient: 'Ms. Sarah Johnson' } },
    { id: 3, type: 'observation', action: 'create', description: 'Lerato - Language observation', timestamp: 'Yesterday 14:20', status: 'failed', retries: 2, data: { student: 'Lerato Molefe', area: 'Language' } },
    { id: 4, type: 'attendance', action: 'update', description: 'Morning attendance', timestamp: 'Today 08:45', status: 'completed', retries: 0, data: { date: '2024-03-26', present: 22 } },
    { id: 5, type: 'profile', action: 'update', description: 'Updated phone number', timestamp: 'Today 09:10', status: 'syncing', retries: 0, data: { field: 'phone', value: '+27 83 123 4567' } },
  ])

  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSyncAll = async () => {
    if (!isOnline) {
      toast({
        title: 'Cannot sync offline',
        description: 'You need to be online to sync changes',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSyncing(true)
    setSyncProgress(0)

    // Simulate sync process
    const pendingItems = syncQueue.filter(item => item.status === 'pending' || item.status === 'failed')
    
    for (let i = 0; i < pendingItems.length; i++) {
      setSyncProgress(Math.round((i / pendingItems.length) * 100))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update item status
      setSyncQueue(prev => prev.map(item => 
        item.id === pendingItems[i].id 
          ? { ...item, status: 'completed', retries: 0 }
          : item
      ))
    }

    setSyncProgress(100)
    setIsSyncing(false)

    toast({
      title: 'Sync completed',
      description: `${pendingItems.length} items synced successfully`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleRetryItem = (itemId: number) => {
    setSyncQueue(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status: 'syncing', retries: item.retries + 1 }
        : item
    ))

    // Simulate retry
    setTimeout(() => {
      setSyncQueue(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'completed' }
          : item
      ))

      toast({
        title: 'Item synced',
        description: 'The item has been successfully synced',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }, 1500)
  }

  const handleRemoveItem = (itemId: number) => {
    setSyncQueue(prev => prev.filter(item => item.id !== itemId))
    
    toast({
      title: 'Item removed',
      description: 'The item has been removed from sync queue',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const viewItemDetails = (item: SyncItem) => {
    setSelectedItem(item)
    onOpen()
  }

  const getStatusColor = (status: SyncItem['status']) => {
    switch (status) {
      case 'pending': return 'yellow'
      case 'syncing': return 'blue'
      case 'completed': return 'green'
      case 'failed': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: SyncItem['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'syncing': return '🔄'
      case 'completed': return '✅'
      case 'failed': return '❌'
      default: return '❓'
    }
  }

  const getTypeIcon = (type: SyncItem['type']) => {
    switch (type) {
      case 'observation': return '📝'
      case 'message': return '💬'
      case 'attendance': return '📊'
      case 'profile': return '👤'
      default: return '📄'
    }
  }

  const pendingCount = syncQueue.filter(item => item.status === 'pending' || item.status === 'failed').length
  const completedCount = syncQueue.filter(item => item.status === 'completed').length
  const totalCount = syncQueue.length

  return (
    <Card>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="lg" mb={2}>
              📱 Offline Sync Manager
            </Heading>
            <Text color="gray.600">
              Manage your offline changes and sync them when you're back online
            </Text>
          </Box>

          {/* Connection Status */}
          <Alert
            status={isOnline ? 'success' : 'warning'}
            variant="subtle"
            borderRadius="lg"
          >
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>
                {isOnline ? 'You are online' : 'You are offline'}
              </AlertTitle>
              <AlertDescription>
                {isOnline 
                  ? 'Changes will sync automatically. You can also sync manually below.'
                  : 'Your changes are saved locally and will sync when you reconnect.'
                }
              </AlertDescription>
            </Box>
            <Badge colorScheme={isOnline ? 'green' : 'orange'} fontSize="md">
              {isOnline ? '● Online' : '○ Offline'}
            </Badge>
          </Alert>

          {/* Sync Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Card>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {pendingCount}
                </Text>
                <Text fontSize="sm" color="gray.600">Pending Sync</Text>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {completedCount}
                </Text>
                <Text fontSize="sm" color="gray.600">Completed</Text>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold">
                  {totalCount}
                </Text>
                <Text fontSize="sm" color="gray.600">Total Items</Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Sync Progress */}
          {isSyncing && (
            <Box p={4} bg="blue.50" borderRadius="lg" borderWidth="1px" borderColor="blue.200">
              <VStack spacing={3}>
                <HStack width="100%" justify="space-between">
                  <Text fontWeight="bold">Syncing in progress...</Text>
                  <Text fontWeight="bold">{syncProgress}%</Text>
                </HStack>
                <Progress value={syncProgress} colorScheme="blue" size="sm" borderRadius="full" />
                <Text fontSize="sm" color="gray.600">
                  Syncing your changes to the server. Please don't close the app.
                </Text>
              </VStack>
            </Box>
          )}

          {/* Sync Controls */}
          <HStack spacing={4}>
            <Button
              leftIcon={<RepeatIcon />}
              colorScheme="brand"
              onClick={handleSyncAll}
              isLoading={isSyncing}
              loadingText="Syncing..."
              isDisabled={!isOnline || pendingCount === 0}
            >
              Sync All Now
            </Button>
            
            <Button
              leftIcon={<DownloadIcon />}
              variant="outline"
              onClick={() => {
                toast({
                  title: 'Exporting sync data',
                  description: 'Your sync data will be downloaded',
                  status: 'info',
                  duration: 2000,
                })
              }}
            >
              Export Data
            </Button>
            
            <Button
              leftIcon={<AttachmentIcon />}
              variant="outline"
              onClick={() => {
                toast({
                  title: 'Importing data',
                  description: 'Data import feature would open here',
                  status: 'info',
                  duration: 2000,
                })
              }}
            >
              Import Data
            </Button>
          </HStack>

          {/* Sync Queue Table */}
          <Box>
            <HStack justify="space-between" mb={4}>
              <Heading size="md">Sync Queue</Heading>
              <Badge colorScheme="gray">
                {pendingCount} pending, {completedCount} completed
              </Badge>
            </HStack>
            
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Type</Th>
                    <Th>Description</Th>
                    <Th>Time</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {syncQueue.map((item) => (
                    <Tr key={item.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <HStack spacing={2}>
                          <Box>{getTypeIcon(item.type)}</Box>
                          <Text textTransform="capitalize">{item.type}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontWeight="medium">{item.description}</Text>
                        <Text fontSize="xs" color="gray.600">
                          {item.action === 'create' ? 'New' : item.action === 'update' ? 'Updated' : 'Deleted'}
                        </Text>
                      </Td>
                      <Td>{item.timestamp}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(item.status)}>
                          <HStack spacing={1}>
                            <Box>{getStatusIcon(item.status)}</Box>
                            <Text textTransform="capitalize">{item.status}</Text>
                            {item.retries > 0 && (
                              <Text fontSize="xs">({item.retries})</Text>
                            )}
                          </HStack>
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="View details"
                            icon={<ViewIcon />}
                            size="xs"
                            variant="ghost"
                            onClick={() => viewItemDetails(item)}
                          />
                          {(item.status === 'pending' || item.status === 'failed') && (
                            <IconButton
                              aria-label="Retry sync"
                              icon={<RepeatIcon />}
                              size="xs"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => handleRetryItem(item.id)}
                              isDisabled={!isOnline}
                            />
                          )}
                          <IconButton
                            aria-label="Remove from queue"
                            icon={<CloseIcon />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleRemoveItem(item.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Conflict Resolution Info */}
          <Box p={4} bg="orange.50" borderRadius="lg" borderWidth="1px" borderColor="orange.200">
            <VStack spacing={3} align="stretch">
              <Heading size="sm" color="orange.700">
                ⚠️ Conflict Resolution
              </Heading>
              <Text fontSize="sm">
                If the same data was modified both online and offline, you'll be prompted to resolve conflicts.
                The app will show you both versions and let you choose which one to keep.
              </Text>
              <Button
                size="sm"
                variant="outline"
                colorScheme="orange"
                width="fit-content"
                onClick={() => {
                  toast({
                    title: 'Conflict resolution',
                    description: 'No conflicts detected at this time',
                    status: 'info',
                    duration: 2000,
                  })
                }}
              >
                Check for Conflicts
              </Button>
            </VStack>
          </Box>

          {/* Storage Info */}
          <Box p={4} bg="blue.50" borderRadius="lg" borderWidth="1px" borderColor="blue.200">
            <VStack spacing={3} align="stretch">
              <Heading size="sm" color="blue.700">
                💾 Local Storage
              </Heading>
              <Progress value={65} colorScheme="blue" size="sm" borderRadius="full" />
              <HStack justify="space-between">
                <Text fontSize="sm">2.3 MB of 10 MB used</Text>
                <Text fontSize="sm">23% full</Text>
              </HStack>
              <Text fontSize="xs" color="gray.600">
                Your data is stored locally using IndexedDB. It's encrypted and secure.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </CardBody>

      {/* Item Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sync Item Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedItem && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={2}>Item Information</Text>
                  <Table variant="simple" size="sm">
                    <Tbody>
                      <Tr>
                        <Td fontWeight="medium">Type</Td>
                        <Td>
                          <Badge colorScheme="blue">
                            {getTypeIcon(selectedItem.type)} {selectedItem.type}
                          </Badge>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="medium">Action</Td>
                        <Td textTransform="capitalize">{selectedItem.action}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="medium">Status</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(selectedItem.status)}>
                            {getStatusIcon(selectedItem.status)} {selectedItem.status}
                          </Badge>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="medium">Description</Td>
                        <Td>{selectedItem.description}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="medium">Timestamp</Td>
                        <Td>{selectedItem.timestamp}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="medium">Retry Count</Td>
                        <Td>{selectedItem.retries}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>Data Content</Text>
                  <Box p={3} bg="gray.50" borderRadius="md" overflowX="auto">
                    <Code fontSize="xs" whiteSpace="pre">
                      {JSON.stringify(selectedItem.data, null, 2)}
                    </Code>
                  </Box>
                </Box>

                <Text fontSize="sm" color="gray.600">
                  This data is stored locally and will be synced to the server when possible.
                </Text>

                <HStack spacing={3} pt={4}>
                  <Button
                    colorScheme="blue"
                    onClick={() => {
                      handleRetryItem(selectedItem.id)
                      onClose()
                    }}
                    isDisabled={!isOnline || selectedItem.status === 'completed'}
                  >
                    Retry Sync
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedItem.data, null, 2))
                      toast({
                        title: 'Copied to clipboard',
                        status: 'success',
                        duration: 2000,
                      })
                    }}
                  >
                    Copy Data
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  )
}

// Add the missing import for SimpleGrid
import { SimpleGrid } from '@chakra-ui/react'

export default SyncManager