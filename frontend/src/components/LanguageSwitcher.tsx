import { Button, HStack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation()
  const currentLang = i18n.language

  const toggleLanguage = () => {
    const newLang = currentLang.startsWith('tn') ? 'en' : 'tn'
    i18n.changeLanguage(newLang)
    localStorage.setItem('i18nextLng', newLang)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      aria-label={t('language.switch')}
    >
      <HStack spacing={2}>
        <Text>{currentLang.startsWith('tn') ? '🇿🇦' : '🇬🇧'}</Text>
        <Text>{currentLang.startsWith('tn') ? t('language.english') : t('language.setswana')}</Text>
      </HStack>
    </Button>
  )
}

export default LanguageSwitcher