import { useEffect, useState, useMemo } from 'react'
import {
  Paper, Text, Group, Stack, Skeleton, Box, ScrollArea, Tooltip, SimpleGrid,
} from '@mantine/core'
import {
  IconSun, IconCloud, IconCloudRain, IconCloudStorm, IconSnowflake,
  IconTemperature, IconDroplet, IconArrowUp, IconArrowDown,
} from '@tabler/icons-react'

const WEATHER_ICONS = {
  0: { icon: IconSun, label: 'Despejado', color: 'yellow' },
  1: { icon: IconCloud, label: 'Mayormente despejado', color: 'yellow' },
  2: { icon: IconCloud, label: 'Parcialmente nublado', color: 'gray' },
  3: { icon: IconCloud, label: 'Nublado', color: 'gray' },
  45: { icon: IconCloud, label: 'Niebla', color: 'gray' },
  48: { icon: IconCloud, label: 'Niebla escarchada', color: 'gray' },
  51: { icon: IconCloudRain, label: 'Llovizna ligera', color: 'blue' },
  53: { icon: IconCloudRain, label: 'Llovizna moderada', color: 'blue' },
  55: { icon: IconCloudRain, label: 'Llovizna densa', color: 'blue' },
  56: { icon: IconCloudRain, label: 'Llovizna helada', color: 'blue' },
  57: { icon: IconCloudRain, label: 'Llovizna helada densa', color: 'blue' },
  61: { icon: IconCloudRain, label: 'Lluvia ligera', color: 'blue' },
  63: { icon: IconCloudRain, label: 'Lluvia moderada', color: 'blue' },
  65: { icon: IconCloudRain, label: 'Lluvia fuerte', color: 'blue' },
  66: { icon: IconCloudRain, label: 'Lluvia helada ligera', color: 'blue' },
  67: { icon: IconCloudRain, label: 'Lluvia helada fuerte', color: 'blue' },
  71: { icon: IconSnowflake, label: 'Nieve ligera', color: 'cyan' },
  73: { icon: IconSnowflake, label: 'Nieve moderada', color: 'cyan' },
  75: { icon: IconSnowflake, label: 'Nieve fuerte', color: 'cyan' },
  77: { icon: IconSnowflake, label: 'Granos de nieve', color: 'cyan' },
  80: { icon: IconCloudRain, label: 'Chubascos ligeros', color: 'blue' },
  81: { icon: IconCloudRain, label: 'Chubascos moderados', color: 'blue' },
  82: { icon: IconCloudRain, label: 'Chubascos violentos', color: 'blue' },
  85: { icon: IconSnowflake, label: 'Chubascos de nieve ligeros', color: 'cyan' },
  86: { icon: IconSnowflake, label: 'Chubascos de nieve fuertes', color: 'cyan' },
  95: { icon: IconCloudStorm, label: 'Tormenta', color: 'purple' },
  96: { icon: IconCloudStorm, label: 'Tormenta con granizo ligero', color: 'purple' },
  99: { icon: IconCloudStorm, label: 'Tormenta con granizo fuerte', color: 'purple' },
}

export default function WeatherWidget({ compact = false }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fincaId = localStorage.getItem('agrop_finca_id')

  useEffect(() => {
    if (!fincaId) {
      setLoading(false)
      return
    }

    const cacheKey = `agrop_weather_${fincaId}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          setWeather(parsed.data)
          setLoading(false)
          return
        }
      } catch {}
    }

    const lat = localStorage.getItem(`agrop_finca_lat_${fincaId}`)
    const lon = localStorage.getItem(`agrop_finca_lon_${fincaId}`)

    if (!lat || !lon) {
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=8`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const result = {
          current: data.current,
          daily: data.daily,
        }
        localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }))
        setWeather(result)
        setLoading(false)
      })
      .catch(() => {
        setError('Error al cargar clima')
        setLoading(false)
      })
  }, [fincaId])

  const WeatherIcon = ({ code, size = 20 }) => {
    const def = WEATHER_ICONS[code] || WEATHER_ICONS[0]
    const Icon = def.icon
    return <Icon size={size} color={`var(--mantine-color-${def.color}-6)`} />
  }

  if (loading) {
    return (
      <Paper p="sm" radius="md" withBorder={!compact}>
        <Skeleton height={compact ? 60 : 100} />
      </Paper>
    )
  }

  if (!weather || error) {
    if (compact) return null
    return (
      <Paper p="md" radius="md" withBorder>
        <Text size="sm" c="dimmed" ta="center">
          {error || 'No hay datos climáticos disponibles'}
        </Text>
      </Paper>
    )
  }

  const { current, daily } = weather
  const temp = Math.round(current.temperature_2m)
  const precip = current.precipitation || 0
  const weatherCode = current.weather_code

  if (compact) {
    return (
      <Paper p="xs" radius="md" withBorder>
        <Group gap={6} justify="center">
          <WeatherIcon code={weatherCode} size={18} />
          <Text fw={700} size="sm">{temp}°C</Text>
          {precip > 0 && (
            <>
              <IconDroplet size={14} color="var(--mantine-color-blue-6)" />
              <Text size="xs">{precip} mm</Text>
            </>
          )}
        </Group>
      </Paper>
    )
  }

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap={6}>
          <WeatherIcon code={weatherCode} size={28} />
          <Text fw={700} size="xl">{temp}°C</Text>
        </Group>
        <Group gap={8}>
          {daily.temperature_2m_max[0] != null && (
            <Tooltip label="Máx">
              <Group gap={2}>
                <IconArrowUp size={14} color="var(--mantine-color-red-6)" />
                <Text size="sm" fw={600}>{Math.round(daily.temperature_2m_max[0])}°</Text>
              </Group>
            </Tooltip>
          )}
          {daily.temperature_2m_min[0] != null && (
            <Tooltip label="Mín">
              <Group gap={2}>
                <IconArrowDown size={14} color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={600}>{Math.round(daily.temperature_2m_min[0])}°</Text>
              </Group>
            </Tooltip>
          )}
          {precip > 0 && (
            <Group gap={2}>
              <IconDroplet size={16} color="var(--mantine-color-blue-6)" />
              <Text size="sm">{precip} mm</Text>
            </Group>
          )}
        </Group>
      </Group>

      <Text size="xs" c="dimmed" mb="xs">Pronóstico 7 días</Text>
      <ScrollArea>
        <Group gap={8} wrap="nowrap">
          {daily.time.map((date, i) => {
            const dayName = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][new Date(date).getDay()]
            const isToday = i === 0
            const dayTempMax = daily.temperature_2m_max[i]
            const dayTempMin = daily.temperature_2m_min[i]
            const dayPrecip = daily.precipitation_sum[i]
            const dayCode = daily.weather_code[i]
            return (
              <Paper
                key={date}
                p="xs"
                withBorder
                style={{
                  minWidth: 80, textAlign: 'center',
                  background: isToday ? 'var(--mantine-color-green-0)' : undefined,
                  borderColor: isToday ? 'var(--mantine-color-green-5)' : undefined,
                }}
              >
                <Text size="xs" fw={700} c={isToday ? 'green' : undefined}>{isToday ? 'Hoy' : dayName}</Text>
                <WeatherIcon code={dayCode} size={20} />
                <Text size="sm" fw={600}>{dayTempMax != null ? `${Math.round(dayTempMax)}°` : '-'}</Text>
                <Text size="10px" c="dimmed">{dayTempMin != null ? `${Math.round(dayTempMin)}°` : '-'}</Text>
                {dayPrecip > 0 && (
                  <Group gap={2} justify="center">
                    <IconDroplet size={10} color="var(--mantine-color-blue-6)" />
                    <Text size="10px">{Math.round(dayPrecip)}mm</Text>
                  </Group>
                )}
              </Paper>
            )
          })}
        </Group>
      </ScrollArea>
    </Paper>
  )
}
