/**
 * Login Page — Montessori Mafikeng Connect
 *
 * Authenticates against the backend API. On success the auth store
 * holds the user profile and tokens in memory; role is persisted
 * to localStorage for route guards.
 */

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  Alert,
  AlertIcon,
  InputGroup,
  InputRightElement,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const { t } = useTranslation()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ── Clear stale error on input change ──────────────────────────
  useEffect(() => {
    clearError()
  }, [email, password]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit handler ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      return
    }

    try {
      await login({ email: email.trim(), password })
    } catch {
      // error is already set in the store by the login action
    }
  }

  // ── Theme values ───────────────────────────────────────────────
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // ── Render ─────────────────────────────────────────────────────
  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
      px={4}
    >
      <Box
        w="full"
        maxW="md"
        bg={bgColor}
        borderRadius="xl"
        boxShadow="lg"
        border="1px"
        borderColor={borderColor}
        p={8}
      >
        {/* ─── Header ─── */}
        <Heading
          size="lg"
          textAlign="center"
          mb={2}
          color="brand.600"
        >
          Montessori Mafikeng
        </Heading>
        <Text textAlign="center" color="gray.500" mb={6} fontSize="sm">
          {t('login.welcome', 'Sign in to your account')}
        </Text>

        {/* ─── Error ─── */}
        {error && (
          <Alert status="error" borderRadius="md" mb={4} fontSize="sm">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* ─── Form ─── */}
        <form onSubmit={handleSubmit}>
          <FormControl isRequired mb={4}>
            <FormLabel>{t('login.email', 'Email')}</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder', 'you@school.co.za')}
              autoComplete="email"
              autoFocus
              size="lg"
            />
          </FormControl>

          <FormControl isRequired mb={6}>
            <FormLabel>{t('login.password', 'Password')}</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder', 'Enter your password')}
                autoComplete="current-password"
                size="lg"
              />
              <InputRightElement h="full">
                <IconButton
                  variant="ghost"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  icon={showPassword ? <span>🙈</span> : <span>👁</span>}
                  onClick={() => setShowPassword(!showPassword)}
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Button
            type="submit"
            colorScheme="brand"
            w="full"
            size="lg"
            isLoading={isLoading}
            loadingText={t('login.loading', 'Signing in…')}
          >
            {t('login.submit', 'Sign In')}
          </Button>
        </form>

        {/* ─── Footer ─── */}
        <Text textAlign="center" mt={6} fontSize="xs" color="gray.400">
          Montessori Mafikeng Connect &copy; {new Date().getFullYear()}
        </Text>
      </Box>
    </Box>
  )
}
