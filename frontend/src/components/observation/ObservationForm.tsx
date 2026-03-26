import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Card,
  CardBody,
  Heading,
  Text,
  useToast,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Badge,
  IconButton,
  Progress,
  Image,
  Flex,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { AddIcon, CloseIcon, MicIcon, UploadIcon } from '@chakra-ui/icons'

interface ObservationFormData {
  studentId: string
  montessoriArea: string
  observationText: string
  workCycleDuration: number
  concentrationLevel: number
  notes: string
}

const ObservationForm = () => {
  const { t } = useTranslation()
  const toast = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [workCycleDuration, setWorkCycleDuration] = useState(30)
  const [concentrationLevel, setConcentrationLevel] = useState(3)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ObservationFormData>()

  // Mock student data
  const students = [
    { id: '1', name: 'Thabo Molefe', age: 4 },
    { id: '2', name: 'Lerato Ndlovu', age: 5 },
    { id: '3', name: 'Kagiso Botha', age: 3 },
    { id: '4', name: 'Naledi Smith', age: 6 },
    { id: '5', name: 'Tumi van der Merwe', age: 4 },
    { id: '6', name: 'Boipelo Jones', age: 5 },
  ]

  const montessoriAreas = [
    { value: 'practical_life', label: 'Practical Life', color: 'green' },
    { value: 'sensorial', label: 'Sensorial', color: 'blue' },
    { value: 'language', label: 'Language', color: 'purple' },
    { value: 'mathematics', label: 'Mathematics', color: 'orange' },
    { value: 'culture', label: 'Culture', color: 'red' },
  ]

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      // In a real app, this would upload to cloud storage
      // For demo, we'll create object URLs
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file))
      setPhotos([...photos, ...newPhotos])
      
      toast({
        title: 'Photos uploaded',
        description: `${files.length} photo(s) added to observation`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...photos]
    URL.revokeObjectURL(newPhotos[index]) // Clean up object URL
    newPhotos.splice(index, 1)
    setPhotos(newPhotos)
  }

  const startVoiceRecording = () => {
    setIsRecording(true)
    toast({
      title: 'Voice recording started',
      description: 'Recording... Click stop when finished',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
    
    // Simulate recording for 5 seconds
    setTimeout(() => {
      if (isRecording) {
        stopVoiceRecording()
      }
    }, 5000)
  }

  const stopVoiceRecording = () => {
    setIsRecording(false)
    toast({
      title: 'Voice recording saved',
      description: 'Voice note added to observation',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const onSubmit = async (data: ObservationFormData) => {
    setIsLoading(true)
    try {
      // Add the slider values to the data
      const formData = {
        ...data,
        workCycleDuration,
        concentrationLevel,
        photos,
        voiceRecording: isRecording ? 'recorded' : null,
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Observation saved successfully!',
        description: 'The observation has been recorded and will sync with the server.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      // Reset form
      reset()
      setPhotos([])
      setWorkCycleDuration(30)
      setConcentrationLevel(3)
      setIsRecording(false)
      
    } catch (error) {
      toast({
        title: 'Failed to save observation',
        description: 'Please try again. Your data is saved locally and will sync when online.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const concentrationLabels = ['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High']

  return (
    <Card>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>
              📝 New Montessori Observation
            </Heading>
            <Text color="gray.600">
              Record detailed observations of student work following Montessori principles
            </Text>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6} align="stretch">
              {/* Student Selection */}
              <FormControl isInvalid={!!errors.studentId}>
                <FormLabel>Student</FormLabel>
                <Select
                  placeholder="Select a student"
                  {...register('studentId', { required: 'Please select a student' })}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} (Age {student.age})
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Montessori Area */}
              <FormControl isInvalid={!!errors.montessoriArea}>
                <FormLabel>Montessori Area</FormLabel>
                <Select
                  placeholder="Select Montessori area"
                  {...register('montessoriArea', { required: 'Please select a Montessori area' })}
                >
                  {montessoriAreas.map((area) => (
                    <option key={area.value} value={area.value}>
                      {area.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Observation Text */}
              <FormControl isInvalid={!!errors.observationText}>
                <FormLabel>Observation Details</FormLabel>
                <Textarea
                  placeholder="Describe what you observed... (What did the child do? How did they engage with the material? What was their level of concentration?)"
                  rows={4}
                  {...register('observationText', { 
                    required: 'Please describe your observation',
                    minLength: { value: 10, message: 'Observation should be at least 10 characters' }
                  })}
                />
              </FormControl>

              {/* Voice Recording */}
              <FormControl>
                <FormLabel>Voice Recording</FormLabel>
                <Box p={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg">
                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="medium">Add voice note</Text>
                      <Text fontSize="sm" color="gray.600">
                        Record your observation verbally (great for detailed notes)
                      </Text>
                    </Box>
                    <Button
                      leftIcon={<MicIcon />}
                      colorScheme={isRecording ? 'red' : 'blue'}
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      size="sm"
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Button>
                  </HStack>
                  {isRecording && (
                    <Box mt={3}>
                      <Progress size="sm" isIndeterminate colorScheme="red" />
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        Recording... (auto-stops in 5 seconds)
                      </Text>
                    </Box>
                  )}
                </Box>
              </FormControl>

              {/* Photo Upload */}
              <FormControl>
                <FormLabel>Photos of Work</FormLabel>
                <Box p={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg">
                  <VStack spacing={4}>
                    <Button
                      leftIcon={<UploadIcon />}
                      as="label"
                      cursor="pointer"
                      width="100%"
                      variant="outline"
                    >
                      Upload Photos
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoUpload}
                      />
                    </Button>
                    
                    {photos.length > 0 && (
                      <Box width="100%">
                        <Text fontSize="sm" mb={2}>
                          {photos.length} photo(s) uploaded
                        </Text>
                        <Flex wrap="wrap" gap={2}>
                          {photos.map((photo, index) => (
                            <Box key={index} position="relative">
                              <Image
                                src={photo}
                                alt={`Observation photo ${index + 1}`}
                                boxSize="100px"
                                objectFit="cover"
                                borderRadius="md"
                              />
                              <IconButton
                                aria-label="Remove photo"
                                icon={<CloseIcon />}
                                size="xs"
                                position="absolute"
                                top={1}
                                right={1}
                                colorScheme="red"
                                onClick={() => removePhoto(index)}
                              />
                            </Box>
                          ))}
                        </Flex>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </FormControl>

              {/* Work Cycle Duration */}
              <FormControl>
                <FormLabel>Work Cycle Duration: {workCycleDuration} minutes</FormLabel>
                <Slider
                  min={5}
                  max={180}
                  step={5}
                  value={workCycleDuration}
                  onChange={setWorkCycleDuration}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                  <SliderMark value={30} mt={2} ml={-3} fontSize="sm">
                    30min
                  </SliderMark>
                  <SliderMark value={90} mt={2} ml={-3} fontSize="sm">
                    90min
                  </SliderMark>
                  <SliderMark value={180} mt={2} ml={-3} fontSize="sm">
                    180min
                  </SliderMark>
                </Slider>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Typical Montessori work cycles are 2-3 hours. This helps track engagement duration.
                </Text>
              </FormControl>

              {/* Concentration Level */}
              <FormControl>
                <FormLabel>
                  Concentration Level: {concentrationLevel} - {concentrationLabels[concentrationLevel - 1]}
                </FormLabel>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={concentrationLevel}
                  onChange={setConcentrationLevel}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                  {[1, 2, 3, 4, 5].map((value) => (
                    <SliderMark key={value} value={value} mt={2} ml={-2} fontSize="sm">
                      {value}
                    </SliderMark>
                  ))}
                </Slider>
                <HStack justify="space-between" mt={2}>
                  <Text fontSize="sm" color="gray.600">
                    Low (distracted)
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    High (deep focus)
                  </Text>
                </HStack>
              </FormControl>

              {/* Additional Notes */}
              <FormControl>
                <FormLabel>Additional Notes</FormLabel>
                <Textarea
                  placeholder="Any additional context, follow-up needed, or materials used..."
                  rows={3}
                  {...register('notes')}
                />
              </FormControl>

              {/* Submit Button */}
              <Button
                type="submit"
                colorScheme="brand"
                size="lg"
                width="100%"
                isLoading={isLoading}
                loadingText="Saving Observation..."
                leftIcon={<AddIcon />}
              >
                Save Observation
              </Button>

              {/* Offline Notice */}
              <Box p={3} bg="orange.50" borderRadius="lg" borderWidth="1px" borderColor="orange.200">
                <HStack>
                  <Box>📱</Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">
                      Offline-First Ready
                    </Text>
                    <Text fontSize="xs">
                      Your observation will be saved locally and automatically sync when you're back online.
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </VStack>
          </form>

          {/* Montessori Philosophy Reminder */}
          <Box p={4} bg="blue.50" borderRadius="lg" borderWidth="1px" borderColor="blue.200">
            <VStack spacing={2} align="stretch">
              <Heading size="sm" color="blue.700">
                Montessori Observation Guidelines
              </Heading>
              <Text fontSize="sm">
                • Observe without interrupting the child's work
              </Text>
              <Text fontSize="sm">
                • Note the child's concentration level and engagement
              </Text>
              <Text fontSize="sm">
                • Record what the child does, not what they don't do
              </Text>
              <Text fontSize="sm">
                • Focus on the process, not just the product
              </Text>
              <HStack spacing={2} mt={2}>
                <Badge colorScheme="green">Practical Life</Badge>
                <Badge colorScheme="blue">Sensorial</Badge>
                <Badge colorScheme="purple">Language</Badge>
                <Badge colorScheme="orange">Mathematics</Badge>
                <Badge colorScheme="red">Culture</Badge>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default ObservationForm