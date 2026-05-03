import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  Avatar,
  Badge,
  Card,
  CardBody,
  Textarea,
  IconButton,
  useToast,
  Flex,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Progress,
} from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  AttachmentIcon, 
  EmailIcon, 
  CheckIcon,
  PhoneIcon,
  DownloadIcon,
  DeleteIcon,
  StarIcon,
  HamburgerIcon,
} from '@chakra-ui/icons'

interface Message {
  id: number
  sender: 'teacher' | 'parent'
  name: string
  avatar: string
  content: string
  timestamp: string
  read: boolean
  type: 'text' | 'voice' | 'image'
  voiceDuration?: number
}

const MessageInterface = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [newMessage, setNewMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout>()

  // Mock conversation data
  const [conversation, setConversation] = useState<Message[]>([
    { id: 1, sender: 'teacher', name: 'Ms. Sarah Johnson', avatar: 'SJ', content: 'Good morning! Thabo had a wonderful morning working with the pink tower today.', timestamp: '09:30', read: true, type: 'text' },
    { id: 2, sender: 'parent', name: 'James Molefe', avatar: 'JM', content: 'That\'s great to hear! He loves sensorial materials.', timestamp: '10:15', read: true, type: 'text' },
    { id: 3, sender: 'teacher', name: 'Ms. Sarah Johnson', avatar: 'SJ', content: 'He showed excellent concentration for 45 minutes straight.', timestamp: '10:16', read: true, type: 'text' },
    { id: 4, sender: 'teacher', name: 'Ms. Sarah Johnson', avatar: 'SJ', content: 'I\'ve attached a photo of his work.', timestamp: '10:17', read: true, type: 'image' },
    { id: 5, sender: 'parent', name: 'James Molefe', avatar: 'JM', content: 'Thank you for the update! Can we schedule a quick call tomorrow?', timestamp: '14:30', read: true, type: 'text' },
    { id: 6, sender: 'teacher', name: 'Ms. Sarah Johnson', avatar: 'SJ', content: 'Sure, how about 3 PM? I sent a voice message with more details.', timestamp: '15:45', read: false, type: 'voice', voiceDuration: 45 },
  ])

  const contacts = [
    { id: 1, name: 'Ms. Sarah Johnson', role: 'Teacher', unread: 3, lastMessage: 'He showed excellent concentration...', avatar: 'SJ' },
    { id: 2, name: 'Mr. David Smith', role: 'Teacher (6-9 class)', unread: 0, lastMessage: 'Lerato is progressing well in...', avatar: 'DS' },
    { id: 3, name: 'School Office', role: 'Administration', unread: 1, lastMessage: 'Reminder: Cultural Day this Friday', avatar: 'SO' },
    { id: 4, name: 'Principal Ndlovu', role: 'Principal', unread: 0, lastMessage: 'Thank you for attending the...', avatar: 'PN' },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation])

  const startVoiceRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)

    toast({
      title: 'Voice recording started',
      description: 'Recording... Click stop when finished',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  const stopVoiceRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    
    setIsRecording(false)
    
    // Add voice message to conversation
    const newVoiceMessage: Message = {
      id: conversation.length + 1,
      sender: 'parent',
      name: 'James Molefe',
      avatar: 'JM',
      content: 'Voice message',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'voice',
      voiceDuration: recordingTime,
    }
    
    setConversation([...conversation, newVoiceMessage])
    
    toast({
      title: 'Voice message sent',
      description: `${recordingTime} second voice message recorded`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const newMsg: Message = {
      id: conversation.length + 1,
      sender: 'parent',
      name: 'James Molefe',
      avatar: 'JM',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'text',
    }

    setConversation([...conversation, newMsg])
    setNewMessage('')

    toast({
      title: 'Message sent',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardBody p={0}>
        <Flex height="600px">
          {/* Contacts Sidebar */}
          <Box width="300px" borderRightWidth="1px" borderRightColor="gray.200">
            <VStack spacing={0} align="stretch" height="100%">
              {/* Header */}
              <Box p={4} borderBottomWidth="1px" borderBottomColor="gray.200">
                <Heading size="md">Messages</Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  School communication
                </Text>
              </Box>

              {/* Contacts List */}
              <Box flex={1} overflowY="auto">
                <VStack spacing={0} align="stretch">
                  {contacts.map((contact) => (
                    <Box
                      key={contact.id}
                      p={4}
                      borderBottomWidth="1px"
                      borderBottomColor="gray.100"
                      _hover={{ bg: 'gray.50' }}
                      cursor="pointer"
                    >
                      <HStack spacing={3}>
                        <Avatar name={contact.name} size="sm" bg="brand.500" color="white" />
                        <Box flex={1}>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">{contact.name}</Text>
                            {contact.unread > 0 && (
                              <Badge colorScheme="red" borderRadius="full">
                                {contact.unread}
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {contact.lastMessage}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {contact.role}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* New Conversation Button */}
              <Box p={4} borderTopWidth="1px" borderTopColor="gray.200">
                <Button
                  colorScheme="brand"
                  size="sm"
                  width="100%"
                  onClick={onOpen}
                >
                  New Conversation
                </Button>
              </Box>
            </VStack>
          </Box>

          {/* Chat Area */}
          <Box flex={1} display="flex" flexDirection="column">
            {/* Chat Header */}
            <Box p={4} borderBottomWidth="1px" borderBottomColor="gray.200">
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Avatar name="Ms. Sarah Johnson" size="md" bg="blue.500" color="white" />
                  <Box>
                    <Heading size="md">Ms. Sarah Johnson</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Teacher • Mixed Age 3-6 • Online
                    </Text>
                  </Box>
                </HStack>
                <HStack>
                  <IconButton
                    aria-label="Voice call"
                    icon={<PhoneIcon />}
                    variant="ghost"
                    colorScheme="blue"
                  />
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="Options"
                      icon={<HamburgerIcon />}
                      variant="ghost"
                    />
                    <MenuList>
                      <MenuItem icon={<StarIcon />}>Mark as important</MenuItem>
                      <MenuItem icon={<DownloadIcon />}>Export conversation</MenuItem>
                      <MenuItem icon={<DeleteIcon />} color="red.500">Delete conversation</MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </HStack>
            </Box>

            {/* Messages Area */}
            <Box flex={1} overflowY="auto" p={4} bg="gray.50">
              <VStack spacing={4} align="stretch">
                {conversation.map((message) => (
                  <Box
                    key={message.id}
                    alignSelf={message.sender === 'parent' ? 'flex-end' : 'flex-start'}
                    maxWidth="70%"
                  >
                    <HStack spacing={2} align="flex-start">
                      {message.sender === 'teacher' && (
                        <Avatar name={message.name} size="sm" src="" />
                      )}
                      <Box>
                        <Box
                          bg={message.sender === 'parent' ? 'brand.500' : 'white'}
                          color={message.sender === 'parent' ? 'white' : 'gray.800'}
                          px={4}
                          py={3}
                          borderRadius="lg"
                          borderWidth={message.sender === 'teacher' ? '1px' : '0'}
                          borderColor="gray.200"
                        >
                          {message.type === 'voice' ? (
                            <HStack spacing={3}>
                              <PhoneIcon />
                              <Box>
                                <Text>Voice message</Text>
                                <Text fontSize="xs" opacity={0.8}>
                                  {formatTime(message.voiceDuration || 0)}
                                </Text>
                              </Box>
                              <Button size="xs" variant="ghost" color="inherit">
                                Play
                              </Button>
                            </HStack>
                          ) : message.type === 'image' ? (
                            <VStack spacing={2} align="stretch">
                              <Text>📷 Photo attached</Text>
                              <Box
                                height="150px"
                                bg="gray.200"
                                borderRadius="md"
                                backgroundImage="url(https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60)"
                                backgroundSize="cover"
                                backgroundPosition="center"
                              />
                              <Button size="xs" variant="outline" width="100%" mt={2}>
                                Download Image
                              </Button>
                            </VStack>
                          ) : (
                            <Text>{message.content}</Text>
                          )}
                        </Box>
                        <HStack spacing={2} mt={1} justifyContent={message.sender === 'parent' ? 'flex-end' : 'flex-start'}>
                          <Text fontSize="xs" color="gray.500">
                            {message.timestamp}
                          </Text>
                          {message.sender === 'parent' && message.read && (
                            <CheckIcon boxSize={3} color="green.500" />
                          )}
                        </HStack>
                      </Box>
                      {message.sender === 'parent' && (
                        <Avatar name={message.name} size="sm" src="" />
                      )}
                    </HStack>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            {/* Message Input */}
            <Box p={4} borderTopWidth="1px" borderTopColor="gray.200">
              <VStack spacing={3}>
                {/* Recording indicator */}
                {isRecording && (
                  <Box width="100%" p={3} bg="red.50" borderRadius="lg" borderWidth="1px" borderColor="red.200">
                    <VStack spacing={2}>
                      <HStack width="100%" justify="space-between">
                        <Text fontWeight="bold" color="red.600">
                          🎤 Recording... {formatTime(recordingTime)}
                        </Text>
                        <Button size="sm" colorScheme="red" onClick={stopVoiceRecording}>
                          Stop
                        </Button>
                      </HStack>
                      <Progress size="xs" colorScheme="red" isIndeterminate />
                    </VStack>
                  </Box>
                )}

                {/* Input area */}
                <HStack width="100%" spacing={3}>
                  <IconButton
                    aria-label="Attach file"
                    icon={<AttachmentIcon />}
                    variant="ghost"
                    onClick={() => {
                      toast({
                        title: 'File attachment',
                        description: 'File picker would open here',
                        status: 'info',
                        duration: 2000,
                      })
                    }}
                  />
                  <IconButton
                    aria-label="Record voice message"
                    icon={<PhoneIcon />}
                    variant="ghost"
                    colorScheme={isRecording ? 'red' : 'blue'}
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  />
                  <Textarea
                    placeholder="Type your message here... (Press Enter to send)"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={2}
                    resize="none"
                  />
                  <IconButton
                    aria-label="Send message"
                    icon={<EmailIcon />}
                    colorScheme="brand"
                    onClick={sendMessage}
                    isDisabled={!newMessage.trim()}
                  />
                </HStack>

                {/* Features reminder */}
                <HStack width="100%" justify="space-between">
                  <Text fontSize="xs" color="gray.600">
                    💬 Messages are end-to-end encrypted
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    📱 SMS fallback available for important notifications
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </Box>
        </Flex>
      </CardBody>

      {/* New Conversation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Conversation</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text>
                Start a new conversation with teachers, administrators, or other parents.
              </Text>
              
              <Box>
                <Text fontWeight="medium" mb={2}>Select recipient:</Text>
                <VStack spacing={2} align="stretch">
                  {contacts.map((contact) => (
                    <Box
                      key={contact.id}
                      p={3}
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      _hover={{ bg: 'gray.50' }}
                      cursor="pointer"
                      onClick={() => {
                        toast({
                          title: `Starting conversation with ${contact.name}`,
                          status: 'info',
                          duration: 2000,
                        })
                        onClose()
                      }}
                    >
                      <HStack spacing={3}>
                        <Avatar name={contact.name} size="sm" />
                        <Box>
                          <Text fontWeight="medium">{contact.name}</Text>
                          <Text fontSize="sm" color="gray.600">{contact.role}</Text>
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>

              <Divider />

              <Box>
                <Text fontWeight="medium" mb={2}>Or send to multiple recipients:</Text>
                <HStack spacing={2}>
                  <Button size="sm" variant="outline">Entire Class</Button>
                  <Button size="sm" variant="outline">All Teachers</Button>
                  <Button size="sm" variant="outline">School Announcement</Button>
                </HStack>
              </Box>

              <Button colorScheme="brand" mt={4}>
                Start Conversation
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  )
}

export default MessageInterface