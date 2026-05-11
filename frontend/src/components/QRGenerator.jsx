import { useState, useRef, useEffect } from 'react'
import {
  Modal, Stack, TextInput, Button, Group, Text, Box, Select, Tooltip,
} from '@mantine/core'
import QRCode from 'qrcode'
import { IconQrcode, IconDownload, IconPrinter } from '@tabler/icons-react'

function generateQRCode(content) {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(content, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    }, (err, url) => {
      if (err) reject(err)
      else resolve(url)
    })
  })
}

export default function QRGenerator({ opened, onClose, animal, product }) {
  const canvasRef = useRef(null)
  const [codeType, setCodeType] = useState('animal')
  const [codeValue, setCodeValue] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (animal) {
      setCodeType('animal')
      setCodeValue(animal.codigo || animal.id?.toString() || '')
      setLabel(animal.nombre || `Animal #${animal.id}`)
    } else if (product) {
      setCodeType('product')
      setCodeValue(product.codigo || product.lote || '')
      setLabel(product.nombre || `Lote #${product.id}`)
    }
  }, [animal, product])

  useEffect(() => {
    if (!codeValue) {
      setQrDataUrl(null)
      return
    }
    const prefix = codeType === 'animal' ? 'ANIMAL-' : codeType === 'product' ? 'PROD-' : 'LOTE-'
    const content = `${prefix}${codeValue}`
    setLabel(codeType === 'animal' ? `Animal: ${codeValue}` : codeType === 'product' ? `Producto: ${codeValue}` : `Lote: ${codeValue}`)
    generateQRCode(content).then(setQrDataUrl).catch(() => setQrDataUrl(null))
  }, [codeValue, codeType])

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `QR_${codeType}_${codeValue}.png`
    a.click()
  }

  const handlePrint = () => {
    if (!qrDataUrl) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Imprimir QR</title>
      <style>body{text-align:center;padding:40px;font-family:sans-serif}
      img{max-width:300px} p{margin-top:12px;font-size:14px;color:#555}
      @media print{body{padding:20px} img{max-width:250px}}
      </style></head><body>
      <img src="${qrDataUrl}" alt="QR Code" />
      <p>${label}</p>
      <script>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Generar Código QR" size="sm">
      <Stack>
        {!animal && !product && (
          <>
            <Select
              label="Tipo de código"
              data={[
                { value: 'animal', label: 'Animal' },
                { value: 'product', label: 'Producto' },
                { value: 'lot', label: 'Lote' },
              ]}
              value={codeType}
              onChange={setCodeType}
            />
            <TextInput
              label="Identificador"
              placeholder={codeType === 'animal' ? 'ID o código del animal' : codeType === 'product' ? 'Código de producto' : 'Número de lote'}
              value={codeValue}
              onChange={e => setCodeValue(e.target.value)}
            />
          </>
        )}

        {qrDataUrl ? (
          <Box ta="center" p="md">
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <img src={qrDataUrl} alt="QR Code" style={{ width: 240, height: 240 }} />
            <Text size="sm" c="dimmed" mt="xs">{label}</Text>
            <Group justify="center" mt="md">
              <Tooltip label="Descargar PNG">
                <Button leftSection={<IconDownload size={16} />} variant="light" onClick={handleDownload}>
                  Descargar
                </Button>
              </Tooltip>
              <Tooltip label="Imprimir">
                <Button leftSection={<IconPrinter size={16} />} variant="light" onClick={handlePrint}>
                  Imprimir
                </Button>
              </Tooltip>
            </Group>
          </Box>
        ) : (
          <Box ta="center" p="xl">
            <IconQrcode size={64} color="gray" />
            <Text c="dimmed" mt="sm">Ingresa un identificador para generar el código QR</Text>
          </Box>
        )}
      </Stack>
    </Modal>
  )
}
