import { useState, useRef, useEffect, useCallback } from 'react'
import { Affix, ActionIcon, Paper, Stack, Text, Group, Button, TextInput, ScrollArea, ThemeIcon, Loader, Badge, Tooltip } from '@mantine/core'
import { IconMessage, IconX, IconSend, IconRobot, IconUser, IconBulb, IconPig, IconPlant, IconAlertTriangle, IconCoin, IconCalendarEvent, IconMap } from '@tabler/icons-react'
import { executeQuery } from '../services/queryEngine'
import { useModo } from '../store/ModoContext'
import api from '../services/api'

const QUICK_ACTIONS = [
  { label: 'Resumen de finca', query: 'Resumen de la finca', icon: IconBulb },
  { label: 'Balance del mes', query: 'Balance del mes', icon: IconCoin },
  { label: 'Próximas vacunas', query: 'Próximas vacunas', icon: IconCalendarEvent },
  { label: 'Alertas pendientes', query: '¿Cuántas alertas?', icon: IconAlertTriangle },
  { label: 'Total animales', query: '¿Cuántos animales tengo?', icon: IconPig },
  { label: 'Cultivos activos', query: 'Cultivos activos', icon: IconPlant },
  { label: 'Inventario', query: 'Inventario', icon: IconMap },
]

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy tu asistente AgroP. Puedes preguntarme sobre tus animales, cultivos, alertas, finanzas y más.', timestamp: Date.now() },
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
    setMessages(prev => [...prev, { ...msg, timestamp: Date.now() }])
  }, [])

  const handleQuery = useCallback(async (queryText) => {
    const trimmed = queryText.trim()
    if (!trimmed) return

    addMessage({ role: 'user', text: trimmed })
    setInput('')
    setLoading(true)

    try {
      const result = await executeQuery(trimmed, api)
      addMessage({ role: 'assistant', text: result.text })
    } catch {
      addMessage({ role: 'assistant', text: 'Ocurrió un error al procesar tu consulta.' })
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

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }

  if (modoSencillo) return null

  return (
    <>
      <Affix position={{ bottom: 24, right: 24 }} zIndex={1000}>
        <Tooltip label={open ? 'Cerrar asistente' : 'Abrir asistente'} position="left">
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
        </Tooltip>
      </Affix>

      <Paper
        shadow="lg"
        withBorder
        style={{
          position: 'fixed', bottom: 84, right: 24,
          width: 400, height: 560, borderRadius: 16, zIndex: 1000,
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
                <div style={{ maxWidth: '80%' }}>
                  <Paper
                    p="xs"
                    style={{
                      borderRadius: 12,
                      background: msg.role === 'user' ? 'var(--mantine-color-grape-1)' : 'var(--mantine-color-gray-0)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Text size="sm">{msg.text}</Text>
                  </Paper>
                  <Text size="xs" c="dimmed" ta={msg.role === 'user' ? 'right' : 'left'} mt={2}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </div>
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
                    <Text size="sm" c="dimmed">Consultando...</Text>
                  </Group>
                </Paper>
              </Group>
            )}
          </Stack>
        </ScrollArea>

        <Stack gap={4} px="sm" pb={4}>
          <ScrollArea style={{ maxWidth: '100%' }} type="never">
            <Group gap={4} wrap="nowrap">
              {QUICK_ACTIONS.map(qa => (
                <Button
                  key={qa.label}
                  size="compact-xs"
                  variant="light"
                  color="grape"
                  onClick={() => handleQuickAction(qa.query)}
                  disabled={loading}
                  styles={{ root: { borderRadius: 12 } }}
                  leftSection={<qa.icon size={12} />}
                >
                  {qa.label}
                </Button>
              ))}
            </Group>
          </ScrollArea>
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
