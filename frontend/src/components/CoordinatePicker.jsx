import { useState } from 'react'
import { Button, Group, TextInput, Stack, Text, ActionIcon, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconMapPin, IconCrosshair } from '@tabler/icons-react'

export default function CoordinatePicker({ value, onChange, label = "Coordenadas" }) {
  const [lat, setLat] = useState(value?.lat?.toString() || '')
  const [lng, setLng] = useState(value?.lng?.toString() || '')
  const [loading, setLoading] = useState(false)

  const handleGetCurrent = () => {
    if (!navigator.geolocation) {
      notifications.show({ title: 'Geolocalización no soportada', color: 'red' })
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latStr = pos.coords.latitude.toFixed(7)
        const lngStr = pos.coords.longitude.toFixed(7)
        setLat(latStr)
        setLng(lngStr)
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => {
        notifications.show({ title: 'Error al obtener ubicación', message: 'Verifica permisos de GPS', color: 'red' })
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleManualChange = (field, val) => {
    if (field === 'lat') setLat(val)
    else setLng(val)
    const latNum = parseFloat(field === 'lat' ? val : lat)
    const lngNum = parseFloat(field === 'lng' ? val : lng)
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      onChange({ lat: latNum, lng: lngNum })
    }
  }

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center">
        <Text size="sm" fw={500}>{label}</Text>
        <Tooltip label="Obtener coordenadas actuales (GPS)">
          <Button
            size="xs"
            variant="light"
            color="blue"
            leftSection={<IconCrosshair size={14} />}
            onClick={handleGetCurrent}
            loading={loading}
          >
            GPS
          </Button>
        </Tooltip>
      </Group>
      <Group grow>
        <TextInput
          placeholder="Latitud"
          value={lat}
          onChange={e => handleManualChange('lat', e.target.value)}
          leftSection={<IconMapPin size={14} />}
          size="xs"
        />
        <TextInput
          placeholder="Longitud"
          value={lng}
          onChange={e => handleManualChange('lng', e.target.value)}
          leftSection={<IconMapPin size={14} />}
          size="xs"
        />
      </Group>
      {(lat && lng) && (
        <Text size="xs" c="dimmed">
          {lat}, {lng}
          <Button
            size="xs"
            variant="subtle"
            color="blue"
            ml="xs"
            component="a"
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=18`}
            target="_blank"
            rel="noopener"
          >
            Ver en mapa
          </Button>
        </Text>
      )}
    </Stack>
  )
}
