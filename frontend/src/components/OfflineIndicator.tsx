import { Badge, Box, HStack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Simulate syncing for demo purposes
    const interval = setInterval(() => {
      if (!isOnline) {
        setIsSyncing(Math.random() > 0.7)
      }
    }, 3000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isOnline])

  return (
    <Box>
      <HStack spacing={2}>
        <Badge
          colorScheme={isOnline ? 'green' : 'orange'}
          px={3}
          py={1}
          borderRadius="full"
          fontSize="sm"
        >
          {isOnline ? '●' : '○'} {isOnline ? t('offline.online') : t('offline.offline')}
        </Badge>
        {!isOnline && isSyncing && (
          <Badge colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="sm">
            {t('offline.syncing')}
          </Badge>
        )}
      </HStack>
      {!isOnline && (
        <Text fontSize="sm" color="gray.600" mt={2}>
          Your changes will sync automatically when you're back online
        </Text>
      )}
    </Box>
  )
}

export default OfflineIndicator