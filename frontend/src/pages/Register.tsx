import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Select,
  Stack,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: 'teacher' | 'parent' | 'admin' | 'principal'
  password: string
  confirmPassword: string
}

const Register = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>()

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: t('auth.registerSuccess'),
        description: `Welcome ${data.firstName}! Your account has been created as a ${data.role}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      // Navigate to login page
      navigate('/login')
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: 'Please try again or contact support if the problem persists',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const roleOptions = [
    { value: 'teacher', label: t('auth.teacher') },
    { value: 'parent', label: t('auth.parent') },
    { value: 'admin', label: t('auth.admin') },
    { value: 'principal', label: t('auth.principal') },
  ]

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

          {/* Register Card */}
          <Box bg="white" p={8} borderRadius="xl" boxShadow="lg">
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="lg" mb={2}>
                  {t('auth.register')}
                </Heading>
                <Text color="gray.600">
                  {t('auth.hasAccount')}{' '}
                  <Link as={RouterLink} to="/login" color="brand.600" fontWeight="semibold">
                    {t('auth.signIn')}
                  </Link>
                </Text>
              </Box>

              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing={4}>
                  {/* First Name & Last Name */}
                  <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} width="100%">
                    <FormControl isInvalid={!!errors.firstName}>
                      <FormLabel htmlFor="firstName">{t('auth.firstName')}</FormLabel>
                      <Input
                        id="firstName"
                        placeholder="John"
                        {...register('firstName', {
                          required: t('errors.required'),
                          minLength: {
                            value: 2,
                            message: t('errors.minLength', { count: 2 }),
                          },
                        })}
                      />
                      <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.lastName}>
                      <FormLabel htmlFor="lastName">{t('auth.lastName')}</FormLabel>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        {...register('lastName', {
                          required: t('errors.required'),
                          minLength: {
                            value: 2,
                            message: t('errors.minLength', { count: 2 }),
                          },
                        })}
                      />
                      <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
                    </FormControl>
                  </Stack>

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

                  {/* Phone */}
                  <FormControl isInvalid={!!errors.phone}>
                    <FormLabel htmlFor="phone">{t('auth.phone')}</FormLabel>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+27 12 345 6789"
                      {...register('phone', {
                        required: t('errors.required'),
                        pattern: {
                          value: /^[\+]?[1-9][\d]{0,15}$/,
                          message: 'Please enter a valid phone number',
                        },
                      })}
                    />
                    <FormErrorMessage>{errors.phone?.message}</FormErrorMessage>
                  </FormControl>

                  {/* Role Selection */}
                  <FormControl isInvalid={!!errors.role}>
                    <FormLabel htmlFor="role">{t('auth.role')}</FormLabel>
                    <Select
                      id="role"
                      placeholder={t('auth.selectRole')}
                      {...register('role', {
                        required: t('errors.required'),
                      })}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors.role?.message}</FormErrorMessage>
                  </FormControl>

                  {/* Password */}
                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel htmlFor="password">{t('auth.password')}</FormLabel>
                    <InputGroup>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('password', {
                          required: t('errors.required'),
                          minLength: {
                            value: 6,
                            message: t('errors.minLength', { count: 6 }),
                          },
                        })}
                      />
                      <InputRightElement>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                  </FormControl>

                  {/* Confirm Password */}
                  <FormControl isInvalid={!!errors.confirmPassword}>
                    <FormLabel htmlFor="confirmPassword">{t('auth.confirmPassword')}</FormLabel>
                    <InputGroup>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('confirmPassword', {
                          required: t('errors.required'),
                          validate: (value) =>
                            value === password || t('errors.passwordMismatch'),
                        })}
                      />
                      <InputRightElement>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
                  </FormControl>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    width="100%"
                    isLoading={isLoading}
                    loadingText={t('auth.register')}
                  >
                    {t('auth.register')}
                  </Button>
                </VStack>
              </form>

              {/* Language switcher note */}
              <Box textAlign="center" pt={4} borderTopWidth="1px" borderTopColor="gray.200">
                <Text fontSize="sm" color="gray.600">
                  {t('language.switch')}: 🇿🇦 Setswana / 🇬🇧 English
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* Role Descriptions */}
          <Box bg="gray.50" p={6} borderRadius="xl" borderWidth="1px" borderColor="gray.200">
            <VStack spacing={4} align="stretch">
              <Heading size="md">Role Descriptions</Heading>
              
              <Stack spacing={3}>
                <Box>
                  <Text fontWeight="bold">👨‍🏫 {t('auth.teacher')}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Record observations, track student progress, communicate with parents, manage classroom activities
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">👨‍👩‍👧‍👦 {t('auth.parent')}</Text>
                  <Text fontSize="sm" color="gray.600">
                    View child's progress, receive announcements, communicate with teachers, access school updates
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">👔 {t('auth.admin')}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Manage users, view school analytics, configure system settings, generate reports
                  </Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">🎓 {t('auth.principal')}</Text>
                  <Text fontSize="sm" color="gray.600">
                    School-wide oversight, teacher management, strategic planning, parent relations
                  </Text>
                </Box>
              </Stack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default Register