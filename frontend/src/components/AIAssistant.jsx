import { useState, useRef, useEffect, useCallback } from 'react'
import { Affix, ActionIcon, Paper, Stack, Text, Group, Button, TextInput, ScrollArea, ThemeIcon, Loader, Badge } from '@mantine/core'
import { IconMessage, IconX, IconSend, IconRobot, IconUser, IconBulb, IconAlertTriangle, IconPig, IconChartBar } from '@tabler/icons-react'
import { parseQuery, getFallbackMessage } from '../services/queryEngine'
import { useModo } from '../store/ModoContext'
import api from '../services/api'

const QUICK_ACTIONS = [
  { label: 'Resumen de la finca', query: 'Resumen de la finca' },
  { label: 'Alertas pendientes', query: '¿Próximas alertas?' },
  { label: 'Animales por especie', query: '¿Cuántos animales tengo por especie?' },
]

function typingDelay(text) {
  return new Promise(resolve => setTimeout(resolve, Math.min(600 + text.length * 8, 2000)))
}

function formatResult(data, template, action, query) {
  if (!data) return 'No encontré información para esa consulta.'

  const lower = query.toLowerCase()

  if (lower.includes('resumen') || template === 'resumen_finca') {
    if (typeof data === 'object') {
      const parts = []
      if (data.total_animales !== undefined) parts.push(`🐮 Animales: ${data.total_animales}`)
      if (data.total_cultivos !== undefined) parts.push(`🌱 Cultivos: ${data.total_cultivos}`)
      if (data.total_lotes !== undefined) parts.push(`🗺️ Lotes: ${data.total_lotes}`)
      if (data.alertas_pendientes !== undefined) parts.push(`🔔 Alertas: ${data.alertas_pendientes}`)
      if (data.ingresos_mes !== undefined) parts.push(`💰 Ingresos del mes: ${formatCOP(data.ingresos_mes)}`)
      if (data.gastos_mes !== undefined) parts.push(`💸 Gastos del mes: ${formatCOP(data.gastos_mes)}`)
      return parts.length > 0 ? parts.join('\n') : JSON.stringify(data, null, 2)
    }
    return typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  }

  if (template === 'balance_mensual') {
    const ing = data.ingresos ?? data.total_ingresos ?? 0
    const gas = data.gastos ?? data.total_gastos ?? 0
    const balance = ing - gas
    return `💰 Ingresos: ${formatCOP(ing)}\n💸 Gastos: ${formatCOP(gas)}\n📊 Balance: ${formatCOP(balance)}`
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return 'No se encontraron resultados.'

    if (action === 'count' || action === 'summary') {
      return `Total: ${data.length} ${template || 'registros'}`
    }

    if (template === 'sin_pesaje') {
      return `Animales sin pesaje reciente: ${data.length}\n${data.slice(0, 10).map(a => `• ${a.codigo}${a.nombre ? ' - ' + a.nombre : ''}`).join('\n')}${data.length > 10 ? `\n... y ${data.length - 10} más` : ''}`
    }

    if (template === 'alertas_pendientes') {
      return data.slice(0, 10).map(a => `🔔 ${a.titulo || a.mensaje || 'Alerta'}: ${a.fecha || ''}`).join('\n') || 'No hay alertas pendientes'
    }

    const items = data.slice(0, 15)
    return items.map(item => {
      const name = item.nombre || item.codigo || item.titulo || `ID ${item.id}`
      const detail = item.especie || item.activo !== undefined ? ` (${item.especie || ''}${item.activo ? '' : ' inactivo'})` : ''
      return `• ${name}${detail}`
    }).join('\n') + (data.length > 15 ? `\n... y ${data.length - 15} más` : '')
  }

  return JSON.stringify(data, null, 2)
}

function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy tu asistente AgroP. Puedes preguntarme sobre tus animales, cultivos, alertas y más.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const viewport = useRef(null)
  const inputRef = useRef(null)
  const { modoSencillo } = useModo()

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg])
  }, [])

  const handleQuery = useCallback(async (queryText) => {
    const trimmed = queryText.trim()
    if (!trimmed) return

    addMessage({ role: 'user', text: trimmed })
    setInput('')
    setLoading(true)

    const parsed = parseQuery(trimmed)

    if (!parsed) {
      await typingDelay(getFallbackMessage(trimmed))
      addMessage({ role: 'assistant', text: getFallbackMessage(trimmed) })
      setLoading(false)
      return
    }

    try {
      const { data } = await api.get(parsed.apiEndpoint, { params: parsed.params })
      await typingDelay(trimmed)
      const result = formatResult(data, parsed.displayTemplate, parsed.action, trimmed)
      addMessage({ role: 'assistant', text: result })
    } catch {
      await typingDelay(trimmed)
      addMessage({ role: 'assistant', text: 'Ocurrió un error al consultar los datos. Verifica tu conexión e intenta de nuevo.' })
    }
    setLoading(false)
  }, [addMessage])

  const handleQuickAction = useCallback((query) => {
    handleQuery(query)
  }, [handleQuery])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuery(input)
    }
  }, [input, handleQuery])

  if (modoSencillo) return null

  return (
    <>
      <Affix position={{ bottom: 24, right: 24 }} zIndex={1000}>
        <ActionIcon
          variant="filled"
          color="grape"
          size={48}
          radius="xl"
          onClick={() => setOpen(!open)}
          styles={{ root: { boxShadow: '0 4px 16px rgba(0,0,0,0.25)' } }}
        >
          {open ? <IconX size={24} /> : <IconMessage size={24} />}
        </ActionIcon>
      </Affix>

      <Paper
        shadow="lg"
        withBorder
        style={{
          position: 'fixed', bottom: 84, right: 24,
          width: 380, height: 520, borderRadius: 16, zIndex: 1000,
          display: open ? 'flex' : 'none', flexDirection: 'column',
        }}
      >
        <Group p="md" pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <ThemeIcon variant="light" color="grape" size="md" radius="xl">
            <IconRobot size={18} />
          </ThemeIcon>
          <div style={{ flex: 1 }}>
            <Text fw={600} size="sm">Asistente AgroP</Text>
            <Text size="xs" c="dimmed">Pregunta en lenguaje natural</Text>
          </div>
          <ActionIcon variant="subtle" onClick={() => setOpen(false)} size="sm"><IconX size={16} /></ActionIcon>
        </Group>

        <ScrollArea style={{ flex: 1 }} p="sm" viewportRef={viewport}>
          <Stack gap="sm">
            {messages.map((msg, i) => (
              <Group key={i} justify={msg.role === 'user' ? 'flex-end' : 'flex-start'} align="flex-start" gap="xs" wrap="nowrap">
                {msg.role === 'assistant' && (
                  <ThemeIcon variant="light" color="grape" size="sm" radius="xl" mt={2}>
                    <IconRobot size={12} />
                  </ThemeIcon>
                )}
                <Paper
                  p="xs"
                  style={{
                    maxWidth: '80%',
                    borderRadius: 12,
                    background: msg.role === 'user' ? 'var(--mantine-color-grape-1)' : 'var(--mantine-color-gray-0)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <Text size="sm">{msg.text}</Text>
                </Paper>
                {msg.role === 'user' && (
                  <ThemeIcon variant="light" color="blue" size="sm" radius="xl" mt={2}>
                    <IconUser size={12} />
                  </ThemeIcon>
                )}
              </Group>
            ))}
            {loading && (
              <Group justify="flex-start" gap="xs" wrap="nowrap">
                <ThemeIcon variant="light" color="grape" size="sm" radius="xl" mt={2}>
                  <IconRobot size={12} />
                </ThemeIcon>
                <Paper p="xs" style={{ borderRadius: 12, background: 'var(--mantine-color-gray-0)' }}>
                  <Group gap={4}>
                    <Loader size="xs" />
                    <Text size="sm" c="dimmed">Pensando...</Text>
                  </Group>
                </Paper>
              </Group>
            )}
          </Stack>
        </ScrollArea>

        <Stack gap={4} px="sm" pb={4}>
          <Group gap={4}>
            {QUICK_ACTIONS.map(qa => (
              <Button
                key={qa.label}
                size="xs"
                variant="light"
                color="grape"
                onClick={() => handleQuickAction(qa.query)}
                disabled={loading}
                styles={{ root: { borderRadius: 12 } }}
              >
                {qa.label}
              </Button>
            ))}
          </Group>
          <Group gap={4}>
            <TextInput
              ref={inputRef}
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ flex: 1 }}
              size="sm"
            />
            <ActionIcon
              variant="filled"
              color="grape"
              onClick={() => handleQuery(input)}
              disabled={loading || !input.trim()}
            >
              <IconSend size={16} />
            </ActionIcon>
          </Group>
        </Stack>
      </Paper>
    </>
  )
}
