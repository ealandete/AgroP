import { useEffect, useState, useCallback } from 'react'
import {
  Paper, Title, Group, Button, Modal, TextInput,
  Select, Badge, Stack, SimpleGrid, Text, ActionIcon,
  Textarea, Divider, ScrollArea,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconMail, IconSend, IconEye, IconMessage,
  IconArrowBack, IconPlus, IconMailOpened,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import api from '../services/api.js'

const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: 'gray' },
  { value: 'media', label: 'Media', color: 'blue' },
  { value: 'alta', label: 'Alta', color: 'red' },
]

const prioridadBadge = (p) => {
  const found = PRIORIDADES.find(x => x.value === p)
  return found || { label: p, color: 'gray' }
}

export default function Mensajeria() {
  const [mensajes, setMensajes] = useState([])
  const [selected, setSelected] = useState(null)
  const [tipo, setTipo] = useState('inbox')
  const [loading, setLoading] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [noLeidos, setNoLeidos] = useState(0)
  const [form, setForm] = useState({ para_id: '', asunto: '', cuerpo: '', prioridad: 'media' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/mensajes/', { params: { tipo } })
      setMensajes(Array.isArray(r.data) ? r.data : [])
    } catch { setMensajes([]) }
    setLoading(false)
  }, [tipo])

  const loadNoLeidos = useCallback(async () => {
    try {
      const r = await api.get('/mensajes/no-leidos')
      setNoLeidos(r.data.total || 0)
    } catch {}
  }, [])

  const loadUsuarios = useCallback(async () => {
    try {
      const r = await api.get('/usuarios/')
      setUsuarios(Array.isArray(r.data) ? r.data : [])
    } catch { setUsuarios([]) }
  }, [])

  useEffect(() => { loadData(); loadNoLeidos() }, [loadData, loadNoLeidos])
  useEffect(() => { loadUsuarios() }, [loadUsuarios])

  const enviadosHoy = mensajes.filter(m =>
    dayjs(m.created_at).isSame(dayjs(), 'day')
  ).length

  const totalConversaciones = new Set(
    mensajes.map(m => tipo === 'inbox' ? m.de_id : m.para_id)
  ).size

  const handleLeer = async (id) => {
    try {
      await api.put(`/mensajes/${id}/leer`)
      setMensajes(mensajes.map(m => m.id === id ? { ...m, leido: true } : m))
      setNoLeidos(Math.max(0, noLeidos - 1))
      if (selected?.id === id) setSelected({ ...selected, leido: true })
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const openNuevo = (paraId = '') => {
    setForm({ para_id: paraId, asunto: '', cuerpo: '', prioridad: 'media' })
    open()
  }

  const handleEnviar = async () => {
    if (!form.para_id || !form.asunto?.trim() || !form.cuerpo?.trim()) {
      notifications.show({ title: 'Completa todos los campos', color: 'yellow' })
      return
    }
    try {
      await api.post('/mensajes/', form)
      notifications.show({ title: 'Mensaje enviado', color: 'green' })
      close()
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const seleccionarMensaje = (m) => {
    setSelected(m)
    if (!m.leido && tipo === 'inbox') handleLeer(m.id)
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Mensajería Interna</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => openNuevo()}>
          Nuevo Mensaje
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <IconMailOpened size={28} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xs" c="dimmed">No leídos</Text>
              <Text size="xl" fw={700}>{noLeidos}</Text>
            </div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <IconSend size={28} color="var(--mantine-color-green-6)" />
            <div>
              <Text size="xs" c="dimmed">Enviados hoy</Text>
              <Text size="xl" fw={700} c="green">{enviadosHoy}</Text>
            </div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <IconMessage size={28} color="var(--mantine-color-violet-6)" />
            <div>
              <Text size="xs" c="dimmed">Conversaciones</Text>
              <Text size="xl" fw={700}>{totalConversaciones}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Group gap={0}>
        <Button
          variant={tipo === 'inbox' ? 'filled' : 'light'}
          onClick={() => { setTipo('inbox'); setSelected(null) }}
          leftSection={<IconMail size={16} />}
          style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
        >
          Inbox {noLeidos > 0 && <Badge size="xs" ml={4}>{noLeidos}</Badge>}
        </Button>
        <Button
          variant={tipo === 'sent' ? 'filled' : 'light'}
          onClick={() => { setTipo('sent'); setSelected(null) }}
          leftSection={<IconSend size={16} />}
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        >
          Enviados
        </Button>
      </Group>

      <Group align="flex-start" gap="md" style={{ flex: 1 }}>
        <Paper withBorder style={{ flex: '0 0 380px', maxHeight: '65vh', overflow: 'auto' }}>
          {mensajes.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">No hay mensajes</Text>
          ) : (
            mensajes.map(m => {
              const pb = prioridadBadge(m.prioridad)
              return (
                <Group
                  key={m.id}
                  p="sm"
                  gap={4}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--mantine-color-gray-2)',
                    background: selected?.id === m.id ? 'var(--mantine-color-blue-0)' : undefined,
                  }}
                  onClick={() => seleccionarMensaje(m)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" mb={2}>
                      <Text size="sm" fw={m.leido ? 400 : 700} truncate>
                        {tipo === 'inbox' ? m.de_nombre : m.para_nombre}
                      </Text>
                      <Text size="xs" c="dimmed">{dayjs(m.created_at).format('DD/MM/YY HH:mm')}</Text>
                    </Group>
                    <Text size="sm" fw={m.leido ? 400 : 700} truncate>{m.asunto}</Text>
                    <Group gap={4} mt={4}>
                      <Badge color={pb.color} size="xs" variant="light">{pb.label}</Badge>
                      {!m.leido && tipo === 'inbox' && (
                        <Badge color="blue" size="xs" variant="filled">Nuevo</Badge>
                      )}
                    </Group>
                  </div>
                </Group>
              )
            })
          )}
        </Paper>

        <Paper withBorder p="md" style={{ flex: 1, minHeight: 300 }}>
          {!selected ? (
            <Text c="dimmed" ta="center" py="xl">Selecciona un mensaje para ver su contenido</Text>
          ) : (
            <Stack>
              <Group justify="space-between">
                <Text size="lg" fw={700}>{selected.asunto}</Text>
                <Badge color={prioridadBadge(selected.prioridad).color} size="sm">
                  {prioridadBadge(selected.prioridad).label}
                </Badge>
              </Group>
              <Divider />
              <Group gap="xs">
                <Text size="sm" c="dimmed">De:</Text>
                <Text size="sm" fw={500}>{selected.de_nombre}</Text>
                <Text size="sm" c="dimmed" ml="sm">Para:</Text>
                <Text size="sm" fw={500}>{selected.para_nombre}</Text>
              </Group>
              <Text size="xs" c="dimmed">{dayjs(selected.created_at).format('DD/MM/YYYY HH:mm')}</Text>
              <Divider />
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{selected.cuerpo}</Text>
              <Divider />
              <Group>
                <Button
                  variant="light"
                  leftSection={<IconArrowBack size={16} />}
                  onClick={() => openNuevo(selected.de_id.toString())}
                >
                  Responder
                </Button>
              </Group>
            </Stack>
          )}
        </Paper>
      </Group>

      <Modal opened={opened} onClose={close} title="Nuevo Mensaje" size="lg">
        <Stack>
          <Select
            label="Para"
            placeholder="Selecciona un destinatario"
            data={usuarios.map(u => ({ value: u.id.toString(), label: `${u.nombre} ${u.apellido || ''}`.trim() }))}
            value={form.para_id}
            onChange={v => setForm({ ...form, para_id: v })}
            searchable
            required
          />
          <TextInput
            label="Asunto"
            value={form.asunto}
            onChange={e => setForm({ ...form, asunto: e.target.value })}
            required
          />
          <Textarea
            label="Mensaje"
            value={form.cuerpo}
            onChange={e => setForm({ ...form, cuerpo: e.target.value })}
            minRows={5}
            required
          />
          <Select
            label="Prioridad"
            data={PRIORIDADES.map(p => ({ value: p.value, label: p.label }))}
            value={form.prioridad}
            onChange={v => setForm({ ...form, prioridad: v || 'media' })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button onClick={handleEnviar} leftSection={<IconSend size={16} />}>Enviar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
