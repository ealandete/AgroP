import { useState, useEffect } from 'react'
import { Group, Text, Button, Switch, Image, Stack, Box } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { notifications } from '@mantine/notifications'
import { IconUpload, IconPhoto, IconX, IconTrash } from '@tabler/icons-react'
import api from '../services/api.js'
import { API_URL } from '../config.js'

export default function LogoPicker({ onSave }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [globalLogo, setGlobalLogo] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(null)
  const fincaId = localStorage.getItem('agrop_finca_id') || 'global'
  const logoId = globalLogo ? 'global' : fincaId

  const loadCurrentLogo = () => {
    setCurrentSrc(`${API_URL}/logo/${logoId}?t=${Date.now()}`)
  }

  useEffect(() => { loadCurrentLogo() }, [logoId])

  const handleDrop = (files) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.value)
    reader.readAsDataURL(f)
  }

  const handleSave = async () => {
    if (!file) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('finca_id', logoId)
      await api.post('/logo/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      notifications.show({ title: 'Logo guardado', message: 'El logo se ha actualizado correctamente', color: 'green' })
      setFile(null)
      setPreview(null)
      window.dispatchEvent(new CustomEvent('logo-updated'))
      loadCurrentLogo()
      if (onSave) onSave()
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.detail || 'Error al guardar el logo',
        color: 'red',
      })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/logo/${logoId}`)
      notifications.show({ title: 'Logo eliminado', message: 'Se ha restaurado el logo por defecto', color: 'green' })
      setCurrentSrc(null)
      window.dispatchEvent(new CustomEvent('logo-updated'))
      if (onSave) onSave()
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.detail || 'Error al eliminar el logo',
        color: 'red',
      })
    }
  }

  return (
    <Stack>
      <Switch
        label="Usar logo global"
        description="Usar el mismo logo para todas las fincas"
        checked={globalLogo}
        onChange={e => setGlobalLogo(e.currentTarget.checked)}
      />

      <Dropzone
        onDrop={handleDrop}
        accept={['image/png', 'image/jpeg', 'image/svg+xml']}
        maxSize={2 * 1024 * 1024}
        loading={saving}
      >
        <Group justify="center" gap="xl" style={{ minHeight: 80, pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconUpload size={32} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={32} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto size={32} />
          </Dropzone.Idle>
          <div>
            <Text size="sm">Arrastra un logo aquí o haz clic para seleccionar</Text>
            <Text size="xs" c="dimmed">PNG, JPG o SVG. Máximo 2MB</Text>
          </div>
        </Group>
      </Dropzone>

      {preview && (
        <Image src={preview} alt="Vista previa" h={80} w="auto" fit="contain" />
      )}

      <Group>
        <Button onClick={handleSave} disabled={!file} loading={saving}>
          Guardar Logo
        </Button>
        <Button variant="light" color="red" onClick={handleDelete} leftSection={<IconTrash size={16} />}>
          Eliminar
        </Button>
      </Group>

      {!preview && (
        <Box>
          <Text size="xs" c="dimmed" mb={4}>Logo actual:</Text>
          {currentSrc ? (
            <Image
              src={currentSrc}
              alt="Logo actual"
              h={60}
              w="auto"
              fit="contain"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <Text size="sm" c="dimmed" fs="italic">No hay logo configurado</Text>
          )}
        </Box>
      )}
    </Stack>
  )
}
