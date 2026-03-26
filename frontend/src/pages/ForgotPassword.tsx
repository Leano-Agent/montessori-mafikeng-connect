import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Link,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

interface ForgotPasswordFormData {
  email: string
}

const ForgotPassword = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>()

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setResetSent(true)
      
      toast({
        title: 'Reset instructions sent',
        description: 'Check your email for password reset instructions',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Failed to send reset instructions',
        description: 'Please try again or contact support',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md" py={12}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading size="xl" color="brand.600" mb={2}>
              🦁 Montessori Mafikeng Connect
            </Heading>
            <Text color="gray.600">{t('welcome.subtitle')}</Text>
          </Box>

          {/* Forgot Password Card */}
          <Box bg="white" p={8} borderRadius="xl" boxShadow="lg">
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="lg" mb={2}>
                  {t('auth.forgotPassword')}
                </Heading>
                <Text color="gray.600">
                  Enter your email address and we'll send you instructions to reset your password.
                </Text>
              </Box>

              {resetSent ? (
                <Alert
                  status="success"
                  variant="subtle"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  height="200px"
                  borderRadius="lg"
                >
                  <AlertIcon boxSize="40px" mr={0} />
                  <AlertTitle mt={4} mb={1} fontSize="lg">
                    Check your email!
                  </AlertTitle>
                  <AlertDescription maxWidth="sm">
                    We've sent password reset instructions to your email address. 
                    Please check your inbox and follow the instructions.
                  </AlertDescription>
                  
                  <Button
                    as={RouterLink}
                    to="/login"
                    colorScheme="brand"
                    mt={6}
                    size="lg"
                  >
                    Back to Login
                  </Button>
                </Alert>
              ) : (
                <>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <VStack spacing={4}>
                      {/* Email */}
                      <FormControl isInvalid={!!errors.email}>
                        <FormLabel htmlFor="email">{t('auth.email')}</FormLabel>
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          {...register('email', {
                            required: t('errors.required'),
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: t('errors.invalidEmail'),
                            },
                          })}
                        />
                        <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                      </FormControl>

                      {/* Submit button */}
                      <Button
                        type="submit"
                        colorScheme="brand"
                        size="lg"
                        width="100%"
                        isLoading={isLoading}
                        loadingText="Sending..."
                      >
                        Send Reset Instructions
                      </Button>
                    </VStack>
                  </form>

                  {/* Back to login */}
                  <Box textAlign="center" pt={4} borderTopWidth="1px" borderTopColor="gray.200">
                    <Text color="gray.600">
                      Remember your password?{' '}
                      <Link as={RouterLink} to="/login" color="brand.600" fontWeight="semibold">
                        {t('auth.signIn')}
                      </Link>
                    </Text>
                  </Box>
                </>
              )}

              {/* Language switcher note */}
              <Box textAlign="center" pt={4} borderTopWidth="1px" borderTopColor="gray.200">
                <Text fontSize="sm" color="gray.600">
                  {t('language.switch')}: 🇿🇦 Setswana / 🇬🇧 English
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* SMS Fallback Info */}
          <Box bg="blue.50" p={6} borderRadius="xl" borderWidth="1px" borderColor="blue.200">
            <VStack spacing={3} align="center" textAlign="center">
              <Heading size="md" color="blue.700">
                📱 SMS Fallback Available
              </Heading>
              <Text fontSize="sm">
                For users without reliable email access, password reset codes can be sent via SMS. 
                Contact your school administrator to enable SMS-based password recovery.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default ForgotPassword