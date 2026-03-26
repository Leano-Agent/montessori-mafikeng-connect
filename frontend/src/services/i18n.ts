import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Translations
const resources = {
  en: {
    translation: {
      welcome: {
        title: 'Welcome to Montessori Mafikeng Connect',
        subtitle: 'A culturally-relevant, Montessori-aligned school management platform for African Montessori schools',
      },
      features: {
        title: 'Core Features',
        montessori: 'Montessori Philosophy First - Individual progress tracking, not standardized testing',
        offline: 'Offline-First Architecture - Works without constant internet',
        setswana: 'Setswana Language Priority - Local language first, English second',
        sms: 'SMS Integration - Critical notifications via SMS',
        mobile: 'Mobile-First PWA - 95% of users access via smartphone',
      },
      development: {
        title: 'Development Status',
        message: 'This platform is currently under development as part of Tyriie Solutions\' African tech sovereignty initiative. Phase 1 (Foundation) is being implemented.',
      },
      africanSovereignty: {
        title: 'African Sovereignty Focus',
        message: 'Built in Africa, for Africa. This project demonstrates African tech sovereignty in education with Setswana language integration, African hosting (AWS Cape Town), and cultural relevance in design.',
      },
      language: {
        switch: 'Switch Language',
        setswana: 'Setswana',
        english: 'English',
      },
      offline: {
        online: 'You are online',
        offline: 'You are offline - working in offline mode',
        syncing: 'Syncing changes...',
      },
      progress: {
        authentication: 'Authentication System',
        observationSystem: 'Observation System',
        communication: 'Communication System',
        offlineFirst: 'Offline-First',
        setswanaIntegration: 'Setswana Integration',
        missionControl: 'Mission Control',
      },
      auth: {
        login: 'Login',
        register: 'Register',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        firstName: 'First Name',
        lastName: 'Last Name',
        phone: 'Phone Number',
        forgotPassword: 'Forgot Password?',
        resetPassword: 'Reset Password',
        rememberMe: 'Remember me',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        signUp: 'Sign Up',
        signIn: 'Sign In',
        role: 'Role',
        teacher: 'Teacher',
        parent: 'Parent',
        admin: 'Administrator',
        principal: 'Principal',
        selectRole: 'Select your role',
        loginSuccess: 'Login successful!',
        registerSuccess: 'Registration successful!',
        logout: 'Logout',
        profile: 'Profile',
      },
      errors: {
        required: 'This field is required',
        invalidEmail: 'Invalid email address',
        passwordMismatch: 'Passwords do not match',
        minLength: 'Must be at least {{count}} characters',
        maxLength: 'Must be at most {{count}} characters',
      },
    },
  },
  tn: {
    translation: {
      welcome: {
        title: 'Re a go amogela go Montessori Mafikeng Connect',
        subtitle: 'Setšwebo sa taolo ya sekolo se se tsamaisanang le setso, se se tsamaelanang le Montessori bakeng sa dikolo tsa Montessori tsa Afrika',
      },
      features: {
        title: 'Ditshegofatso tsa Motheo',
        montessori: 'Philosofi ya Montessori Pele - Go latela tswelopele ya motho ka mong, eseng teko e e laoletsweng',
        offline: 'Tlhago ya Pele ya Go se kgone go tsamaisa Marangrang - E bereka ntle le kgolagano ya marangrang e e tswelelang',
        setswana: 'Tlhokomelo ya Puo ya Setswana Pele - Puo ya selegae pele, Seesimane bobedi',
        sms: 'Kgokaganyo ya SMS - Ditsenyego tsa botlhokwa ka SMS',
        mobile: 'PWA e e Tlhokomelwang ka Dikgala - 95% ya badiri ba e fitlhela ka smartphone',
      },
      development: {
        title: 'Maemo a Tlhabololo',
        message: 'Setšwebo seno se ntse se agiwa jaaka karolo ya thulaganyo ya boikemisetso jwa boikarabelo jwa theknolotši ya Afrika ya Tyriie Solutions. Karolo ya 1 (Motheo) e ntse e diragadiwa.',
      },
      africanSovereignty: {
        title: 'Tlhokomelo ya Boikarabelo jwa Afrika',
        message: 'E agilwe mo Afrika, bakeng sa Afrika. Porojeke eno e bontsha boikarabelo jwa theknolotši ya Afrika mo thutong ka kgokaganyo ya puo ya Setswana, go tsamaisiwa ga Afrika (AWS Cape Town), le go tsamaelana le setso mo moralong.',
      },
      language: {
        switch: 'Fetola Puo',
        setswana: 'Setswana',
        english: 'Seesimane',
      },
      offline: {
        online: 'O kgonne go tsamaisa marangrang',
        offline: 'Ga o kgone go tsamaisa marangrang - o bereka ka mokgwa wa go se kgone go tsamaisa marangrang',
        syncing: 'Go kopanya diphetogo...',
      },
      progress: {
        authentication: 'Tsamaiso ya Tlhomatlhomo',
        observationSystem: 'Tsamaiso ya Tlhokomelo',
        communication: 'Tsamaiso ya Puisano',
        offlineFirst: 'Pele ya Go se Kgone go Tsamaisa Marangrang',
        setswanaIntegration: 'Kgokaganyo ya Setswana',
        missionControl: 'Taolo ya Misionale',
      },
      auth: {
        login: 'Tsena',
        register: 'Ikwadise',
        email: 'Imeile',
        password: 'Leina la sephiri',
        confirmPassword: 'Tlhomamisa Leina la Sephiri',
        firstName: 'Leina',
        lastName: 'Fane',
        phone: 'Nomoro ya mogala',
        forgotPassword: 'O lebetse leina la sephiri?',
        resetPassword: 'Beakanya Leina la Sephiri',
        rememberMe: 'Nkgopole',
        noAccount: 'Ga o na akhaonto?',
        hasAccount: 'O na le akhaonto?',
        signUp: 'Ikwadise',
        signIn: 'Tsena',
        role: 'Boemo',
        teacher: 'Titjhere',
        parent: 'Motswadi',
        admin: 'Molaodi',
        principal: 'Hlogo ya Sekolo',
        selectRole: 'Kgetha boemo jwa gago',
        loginSuccess: 'O tsene ka katlego!',
        registerSuccess: 'Go ikwadisa go atlegile!',
        logout: 'Tswa',
        profile: 'Profaele',
      },
      errors: {
        required: 'Tlhakantswe e a tlhokega',
        invalidEmail: 'Aterese ya imeile e e siamang',
        passwordMismatch: 'Maina a sephiri ga a tsamaisane',
        minLength: 'E tshwanetse go nna bonyane ditlhaka tse {{count}}',
        maxLength: 'E tshwanetse go nna ditlhaka tse {{count}} fela',
      },
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'tn', // Setswana as default for African context
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n