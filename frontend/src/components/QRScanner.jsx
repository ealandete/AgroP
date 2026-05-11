import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Modal, Button, Group, Text, Box, ActionIcon, FileInput, Stack, LoadingOverlay,
} from '@mantine/core'
import {
  IconScan, IconX, IconBulb, IconBulbOff, IconPhoto,
} from '@tabler/icons-react'
import { BrowserMultiFormatReader } from '@zxing/library'

const CODEC_PREFIXES = {
  ANIMAL: ['ANIMAL-', 'ANI-', 'A-'],
  PRODUCT: ['PROD-', 'PRO-', 'P-'],
  LOT: ['LOTE-', 'LOT-', 'L-'],
}

function identifyCode(code) {
  const upper = (code || '').toUpperCase()
  for (const prefix of CODEC_PREFIXES.ANIMAL) {
    if (upper.startsWith(prefix)) return { type: 'animal', value: upper.replace(prefix, '') }
  }
  for (const prefix of CODEC_PREFIXES.PRODUCT) {
    if (upper.startsWith(prefix)) return { type: 'product', value: upper.replace(prefix, '') }
  }
  for (const prefix of CODEC_PREFIXES.LOT) {
    if (upper.startsWith(prefix)) return { type: 'lot', value: upper.replace(prefix, '') }
  }
  if (/^\d+$/.test(code)) return { type: 'animal', value: code }
  return { type: 'unknown', value: code }
}

export default function QRScanner({ opened, onClose }) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const codeReaderRef = useRef(null)
  const [flashOn, setFlashOn] = useState(false)
  const [cameraAvailable, setCameraAvailable] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scannedCode, setScannedCode] = useState(null)
  const [error, setError] = useState(null)

  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      try { codeReaderRef.current.reset() } catch {}
      codeReaderRef.current = null
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setScanning(false)
    setFlashOn(false)
  }, [])

  useEffect(() => {
    if (!opened) {
      stopScanning()
      setScannedCode(null)
      setError(null)
      return
    }
    checkCamera()
    return () => stopScanning()
  }, [opened])

  const checkCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cams = devices.filter(d => d.kind === 'videoinput')
      if (cams.length === 0) {
        setCameraAvailable(false)
        return
      }
      setCameraAvailable(true)
      startCamera()
    } catch {
      setCameraAvailable(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
      startDecoder()
    } catch {
      setCameraAvailable(false)
    }
  }

  const startDecoder = () => {
    const reader = new BrowserMultiFormatReader()
    codeReaderRef.current = reader
    reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (result) {
        const code = result.getText()
        handleScan(code)
      }
    })
  }

  const handleScan = (code) => {
    if (scannedCode) return
    setScannedCode(code)
    stopScanning()
    const identified = identifyCode(code)
    switch (identified.type) {
      case 'animal':
        navigate(`/ficha-animal?id=${identified.value}`)
        onClose()
        break
      case 'product':
        setScannedCode(`Producto: ${identified.value}`)
        break
      case 'lot':
        navigate(`/lotes?filtro=${identified.value}`)
        onClose()
        break
      default:
        setScannedCode(`Código: ${code}`)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    setError(null)
    try {
      const reader = new BrowserMultiFormatReader()
      const imageBitmap = await createImageBitmap(file)
      const result = await reader.decodeFromImageBitmap(imageBitmap)
      handleScan(result.getText())
    } catch (e) {
      setError('No se pudo leer el código. Intente con otra imagen.')
    }
  }

  const toggleFlash = () => {
    if (!videoRef.current?.srcObject) return
    const track = videoRef.current.srcObject.getVideoTracks()[0]
    if (!track) return
    const capabilities = track.getCapabilities()
    if (!capabilities.torch) return
    track.applyConstraints({
      advanced: [{ torch: !flashOn }],
    }).then(() => setFlashOn(!flashOn)).catch(() => {})
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Escanear Código" size="lg" closeOnClickOutside={false}>
      <Stack>
        {cameraAvailable && (
          <Box style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: 8, overflow: 'hidden' }}>
            <LoadingOverlay visible={!scanning} />
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
            <Box style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '60%', height: '40%', border: '2px solid #4caf50', borderRadius: 12,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
            }} />
            <Group style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }} justify="space-between">
              <ActionIcon variant="filled" color="gray" size="lg" onClick={toggleFlash}>
                {flashOn ? <IconBulbOff size={20} /> : <IconBulb size={20} />}
              </ActionIcon>
              <Text size="xs" c="white">Enfoca el código QR/Barras en el recuadro</Text>
              <ActionIcon variant="filled" color="red" size="lg" onClick={onClose}>
                <IconX size={20} />
              </ActionIcon>
            </Group>
          </Box>
        )}

        {!cameraAvailable && (
          <Box p="xl" ta="center">
            <IconScan size={48} color="gray" />
            <Text c="dimmed" mt="sm">Cámara no disponible</Text>
            <Text size="sm" c="dimmed">Puedes subir una imagen con el código</Text>
          </Box>
        )}

        <FileInput
          accept="image/*"
          placeholder="Subir imagen con código QR/barras"
          leftSection={<IconPhoto size={16} />}
          onChange={handleFileUpload}
          clearable
        />

        {scannedCode && (
          <Text ta="center" fw={600} c="green">{scannedCode}</Text>
        )}

        {error && (
          <Text ta="center" c="red" size="sm">{error}</Text>
        )}
      </Stack>
    </Modal>
  )
}
