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
  Stack,
  Text,
  VStack,
  Checkbox,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: t('auth.loginSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      // Navigate to dashboard based on role (in real app, this would come from API response)
      navigate('/dashboard')
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Please check your credentials and try again',
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

          {/* Login Card */}
          <Box bg="white" p={8} borderRadius="xl" boxShadow="lg">
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="lg" mb={2}>
                  {t('auth.login')}
                </Heading>
                <Text color="gray.600">
                  {t('auth.noAccount')}{' '}
                  <Link as={RouterLink} to="/register" color="brand.600" fontWeight="semibold">
                    {t('auth.signUp')}
                  </Link>
                </Text>
              </Box>

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

                  {/* Remember me & Forgot password */}
                  <Stack direction={{ base: 'column', sm: 'row' }} justify="space-between" width="100%">
                    <Checkbox {...register('rememberMe')} colorScheme="brand">
                      {t('auth.rememberMe')}
                    </Checkbox>
                    <Link as={RouterLink} to="/forgot-password" color="brand.600" fontSize="sm">
                      {t('auth.forgotPassword')}
                    </Link>
                  </Stack>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    width="100%"
                    isLoading={isLoading}
                    loadingText={t('auth.login')}
                  >
                    {t('auth.login')}
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

          {/* African Sovereignty Message */}
          <Box bg="brand.50" p={6} borderRadius="xl" borderWidth="1px" borderColor="brand.200">
            <VStack spacing={3} align="center" textAlign="center">
              <Heading size="md" color="brand.700">
                🦁 {t('africanSovereignty.title')}
              </Heading>
              <Text fontSize="sm">{t('africanSovereignty.message')}</Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default Login