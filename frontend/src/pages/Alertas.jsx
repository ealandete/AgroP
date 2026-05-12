import { useEffect, useState, useCallback } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, Badge, ActionIcon, Stack, Tabs, SimpleGrid, Text, Switch,
  Alert, PasswordInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconBell, IconAlertTriangle, IconCheck, IconEye,
  IconSend, IconPlus, IconEdit, IconTrash, IconRefresh,
  IconBrandTelegram, IconCircleFilled, IconMail, IconBrandWhatsapp,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import api from '../services/api.js'

const SEVERIDADES = [
  { value: 'critica', label: 'Crítica', color: 'red' },
  { value: 'alta', label: 'Alta', color: 'orange' },
  { value: 'media', label: 'Media', color: 'yellow' },
  { value: 'baja', label: 'Baja', color: 'gray' },
]

const TIPOS = [
  { value: 'vacuna', label: 'Vacunas', icon: '💉' },
  { value: 'pesaje', label: 'Pesajes', icon: '⚖️' },
  { value: 'inventario', label: 'Inventario', icon: '📦' },
  { value: 'cosecha', label: 'Cosechas', icon: '🌾' },
  { value: 'prestamo', label: 'Préstamos', icon: '🔄' },
  { value: 'analisis', label: 'Análisis', icon: '🧪' },
  { value: 'personalizado', label: 'Personalizadas', icon: '📌' },
]

const TIPO_ICONS = {
  vacuna: '💉', pesaje: '⚖️', inventario: '📦',
  cosecha: '🌾', prestamo: '🔄', analisis: '🧪', personalizado: '📌',
}

const severityColor = (s) => {
  const found = SEVERIDADES.find(x => x.value === s)
  return found?.color || 'gray'
}

function TabAlertas({ data, loading, filters, setFilters, handleLeer, handleResolver, handleGenerar }) {
  const filtered = data.filter(a => {
    if (filters.tipo && a.tipo !== filters.tipo) return false
    if (filters.severidad && a.severidad !== filters.severidad) return false
    if (filters.leida === 'leida' && !a.leida) return false
    if (filters.leida === 'no_leida' && a.leida) return false
    if (filters.resuelta === 'resuelta' && !a.resuelta) return false
    if (filters.resuelta === 'no_resuelta' && a.resuelta) return false
    return true
  })

  return (
    <Stack>
      <Group justify="space-between">
        <Group gap="sm">
          <Select
            placeholder="Tipo" clearable
            data={TIPOS.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
            value={filters.tipo} onChange={v => setFilters({ ...filters, tipo: v })}
            style={{ width: 160 }}
          />
          <Select
            placeholder="Severidad" clearable
            data={SEVERIDADES.map(s => ({ value: s.value, label: s.label }))}
            value={filters.severidad} onChange={v => setFilters({ ...filters, severidad: v })}
            style={{ width: 130 }}
          />
          <Select
            placeholder="Leída" clearable
            data={[{ value: 'leida', label: 'Leída' }, { value: 'no_leida', label: 'No leída' }]}
            value={filters.leida} onChange={v => setFilters({ ...filters, leida: v })}
            style={{ width: 130 }}
          />
          <Select
            placeholder="Resuelta" clearable
            data={[{ value: 'resuelta', label: 'Resuelta' }, { value: 'no_resuelta', label: 'No resuelta' }]}
            value={filters.resuelta} onChange={v => setFilters({ ...filters, resuelta: v })}
            style={{ width: 130 }}
          />
        </Group>
        <Button
          variant="light" leftSection={<IconRefresh size={16} />}
          onClick={handleGenerar} loading={loading}
        >
          Regenerar
        </Button>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Título</Table.Th>
              <Table.Th>Severidad</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map(a => (
              <Table.Tr key={a.id}>
                <Table.Td>
                  <Text size="sm">{dayjs(a.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color="gray" size="sm" variant="light">
                    {TIPO_ICONS[a.tipo] || '📌'} {a.tipo}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>{a.titulo}</Text>
                    {a.descripcion && <Text size="xs" c="dimmed" lineClamp={2}>{a.descripcion}</Text>}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Badge color={severityColor(a.severidad)} size="sm">
                    {a.severidad}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {a.leida && <Badge color="blue" size="xs" variant="light">Leída</Badge>}
                    {a.resuelta && <Badge color="green" size="xs" variant="light">Resuelta</Badge>}
                    {!a.leida && !a.resuelta && <Badge color="orange" size="xs" variant="light">Pendiente</Badge>}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {!a.leida && (
                      <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleLeer(a.id)}>
                        <IconEye size={14} />
                      </ActionIcon>
                    )}
                    {!a.resuelta && (
                      <ActionIcon variant="light" color="green" size="sm" onClick={() => handleResolver(a.id)}>
                        <IconCheck size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="xl">No hay alertas{data.length === 0 ? '. Presione "Regenerar" para generar alertas desde los datos.' : ' con los filtros seleccionados.'}</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}

function TabTelegram() {
  const [token, setToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [probando, setProbando] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api.get('/alertas/config-telegram').then(r => {
      setToken(r.data.bot_token || '')
      setChatId(r.data.chat_id || '')
    }).catch(() => {})
  }, [])

  const guardarConfig = async () => {
    try {
      await api.put('/alertas/config-telegram', { bot_token: token, chat_id: chatId })
      notifications.show({ title: 'Configuración guardada', color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al guardar', color: 'red' })
    }
  }

  const probarConexion = async () => {
    setProbando(true)
    try {
      await guardarConfig()
      const r = await api.post('/alertas/notificar-telegram-probar')
      notifications.show({ title: 'Conectado', message: r.data.mensaje, color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'No se pudo enviar el mensaje de prueba. Verifica token y chat ID.', color: 'red' })
    }
    setProbando(false)
  }

  const enviarAlertas = async () => {
    setEnviando(true)
    try {
      await guardarConfig()
      const r = await api.post('/alertas/notificar-telegram')
      notifications.show({ title: 'Enviado', message: r.data.mensaje, color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al enviar', color: 'red' })
    }
    setEnviando(false)
  }

  return (
    <Stack>
      <Title order={4}>Configuración de Telegram</Title>
      <Paper withBorder p="md">
        <Stack>
          <PasswordInput
            label="Bot Token"
            description="Token del bot de Telegram (obtenido de @BotFather)"
            value={token}
            onChange={e => setToken(e.target.value)}
          />
          <TextInput
            label="Chat ID"
            description="ID del chat o grupo donde se enviarán las notificaciones"
            value={chatId}
            onChange={e => setChatId(e.target.value)}
          />
          <Group>
            <Button onClick={guardarConfig} variant="light" leftSection={<IconCheck size={16} />}>
              Guardar Configuración
            </Button>
            <Button onClick={probarConexion} loading={probando} leftSection={<IconBrandTelegram size={16} />}>
              Probar Conexión
            </Button>
            <Button onClick={enviarAlertas} loading={enviando} leftSection={<IconSend size={16} />}>
              Enviar Alertas Pendientes
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}

function TabEmail() {
  const [config, setConfig] = useState({
    smtp_host: '', smtp_port: 587, smtp_user: '',
    smtp_password: '', from_email: '',
  })
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api.get('/alertas/config-email').then(r => {
      const d = r.data
      setConfig({
        smtp_host: d.smtp_host || '',
        smtp_port: d.smtp_port || 587,
        smtp_user: d.smtp_user || '',
        smtp_password: d.smtp_password || '',
        from_email: d.from_email || '',
      })
    }).catch(() => {})
  }, [])

  const guardarConfig = async () => {
    try {
      await api.put('/alertas/config-email', config)
      notifications.show({ title: 'Configuracion guardada', color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al guardar', color: 'red' })
    }
  }

  const enviarAlertas = async () => {
    setEnviando(true)
    try {
      await guardarConfig()
      const r = await api.post('/alertas/notificar-email')
      notifications.show({ title: 'Enviado', message: r.data.mensaje, color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al enviar', color: 'red' })
    }
    setEnviando(false)
  }

  return (
    <Stack>
      <Title order={4}>Configuracion de Email (SMTP)</Title>
      <Paper withBorder p="md">
        <Stack>
          <TextInput
            label="SMTP Host"
            description="Ej: smtp.gmail.com"
            value={config.smtp_host}
            onChange={e => setConfig({ ...config, smtp_host: e.target.value })}
          />
          <TextInput
            label="SMTP Port"
            description="Usualmente 587 (TLS) o 465 (SSL)"
            value={config.smtp_port}
            onChange={e => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 587 })}
          />
          <TextInput
            label="Usuario"
            description="Correo electronico o nombre de usuario"
            value={config.smtp_user}
            onChange={e => setConfig({ ...config, smtp_user: e.target.value })}
          />
          <PasswordInput
            label="Contrasena"
            description="Contrasena de aplicacion o token"
            value={config.smtp_password}
            onChange={e => setConfig({ ...config, smtp_password: e.target.value })}
          />
          <TextInput
            label="Correo From"
            description="Direccion de envio"
            value={config.from_email}
            onChange={e => setConfig({ ...config, from_email: e.target.value })}
          />
          <Group>
            <Button onClick={guardarConfig} variant="light" leftSection={<IconCheck size={16} />}>
              Guardar Configuracion
            </Button>
            <Button onClick={enviarAlertas} loading={enviando} leftSection={<IconSend size={16} />}>
              Enviar Alertas por Email
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}

function TabWhatsApp() {
  const [config, setConfig] = useState({
    api_url: '', api_key: '', phone_number: '',
  })
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api.get('/alertas/config-whatsapp').then(r => {
      const d = r.data
      setConfig({
        api_url: d.api_url || '',
        api_key: d.api_key || '',
        phone_number: d.phone_number || '',
      })
    }).catch(() => {})
  }, [])

  const guardarConfig = async () => {
    try {
      await api.put('/alertas/config-whatsapp', config)
      notifications.show({ title: 'Configuracion guardada', color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al guardar', color: 'red' })
    }
  }

  const enviarAlertas = async () => {
    setEnviando(true)
    try {
      await guardarConfig()
      const r = await api.post('/alertas/notificar-telegram')
      notifications.show({ title: 'Enviado', message: 'WhatsApp configurado. Use la API externa para enviar.', color: 'green' })
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error al enviar', color: 'red' })
    }
    setEnviando(false)
  }

  return (
    <Stack>
      <Title order={4}>Configuracion de WhatsApp API</Title>
      <Paper withBorder p="md">
        <Stack>
          <TextInput
            label="API URL"
            description="URL de la API de WhatsApp (Ej: https://api.whatsapp.com/send)"
            value={config.api_url}
            onChange={e => setConfig({ ...config, api_url: e.target.value })}
          />
          <PasswordInput
            label="API Key"
            description="Token o clave de la API"
            value={config.api_key}
            onChange={e => setConfig({ ...config, api_key: e.target.value })}
          />
          <TextInput
            label="Numero de telefono"
            description="Numero registrado en la API (con codigo de pais)"
            value={config.phone_number}
            onChange={e => setConfig({ ...config, phone_number: e.target.value })}
          />
          <Group>
            <Button onClick={guardarConfig} variant="light" leftSection={<IconCheck size={16} />}>
              Guardar Configuracion
            </Button>
            <Button onClick={enviarAlertas} loading={enviando} leftSection={<IconSend size={16} />}>
              Enviar Alertas por WhatsApp
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}

function TabWebhooks() {
  const [webhooks, setWebhooks] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ url: '', eventos: '', activo: true })

  const load = () => {
    api.get('/alertas/webhooks/').then(r => setWebhooks(Array.isArray(r.data) ? r.data : [])).catch(() => setWebhooks([]))
  }
  useEffect(load, [])

  const handleSubmit = async () => {
    try {
      if (editando) {
        await api.put(`/alertas/webhooks/${editando}`, form)
        notifications.show({ title: 'Webhook actualizado', color: 'green' })
      } else {
        await api.post('/alertas/webhooks/', form)
        notifications.show({ title: 'Webhook creado', color: 'green' })
      }
      close(); setEditando(null); setForm({ url: '', eventos: '', activo: true }); load()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (wh) => {
    setEditando(wh.id)
    setForm({ url: wh.url, eventos: wh.eventos, activo: wh.activo })
    open()
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/alertas/webhooks/${id}`)
      notifications.show({ title: 'Webhook eliminado', color: 'red' })
      load()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const toggleActivo = async (wh) => {
    try {
      await api.put(`/alertas/webhooks/${wh.id}`, { activo: !wh.activo })
      load()
    } catch (err) {
      notifications.show({ title: 'Error', color: 'red' })
    }
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>Webhooks</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({ url: '', eventos: '', activo: true }); open() }}>
          Nuevo Webhook
        </Button>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>URL</Table.Th>
              <Table.Th>Eventos</Table.Th>
              <Table.Th>Activo</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {webhooks.map(wh => (
              <Table.Tr key={wh.id}>
                <Table.Td><Text size="sm" style={{ maxWidth: 300 }} lineClamp={1}>{wh.url}</Text></Table.Td>
                <Table.Td>
                  {wh.eventos.split(',').map(e => (
                    <Badge key={e} size="xs" color="gray" mr={4}>{e.trim()}</Badge>
                  ))}
                </Table.Td>
                <Table.Td>
                  <Switch size="sm" checked={wh.activo} onChange={() => toggleActivo(wh)} aria-label="Activo" />
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="light" color="blue" size="sm" onClick={() => handleEdit(wh)}>
                      <IconEdit size={14} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDelete(wh.id)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {webhooks.length === 0 && (
              <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin webhooks configurados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Webhook' : 'Nuevo Webhook'} size="md">
        <Stack>
          <TextInput label="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required />
          <Select
            label="Eventos"
            data={[
              { value: 'alerta_nueva', label: 'Alerta nueva' },
              { value: 'alerta_resuelta', label: 'Alerta resuelta' },
              { value: 'inventario_bajo', label: 'Inventario bajo' },
              { value: 'cosecha_vencida', label: 'Cosecha vencida' },
              { value: 'vacuna_proxima', label: 'Vacuna próxima' },
            ]}
            value={form.eventos}
            onChange={v => setForm({ ...form, eventos: v || '' })}
            searchable
            clearable
          />
          <Switch label="Activo" checked={form.activo} onChange={e => setForm({ ...form, activo: e.currentTarget.checked })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editando ? 'Actualizar' : 'Crear'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

export default function Alertas() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ tipo: '', severidad: '', leida: '', resuelta: '' })
  const [channels, setChannels] = useState({ telegram: false, email: false, whatsapp: false })

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const tg = await api.get('/alertas/config-telegram')
        const em = await api.get('/alertas/config-email')
        const wa = await api.get('/alertas/config-whatsapp')
        setChannels({
          telegram: !!(tg.data.bot_token && tg.data.chat_id),
          email: !!(em.data.smtp_host && em.data.from_email),
          whatsapp: !!(wa.data.api_url && wa.data.phone_number),
        })
      } catch {}
    }
    loadChannels()
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/alertas/', { params: { generar: true } })
      setData(Array.isArray(r.data) ? r.data : [])
    } catch {
      setData([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleLeer = async (id) => {
    try {
      await api.put(`/alertas/${id}/leer`)
      setData(data.map(a => a.id === id ? { ...a, leida: true } : a))
      notifications.show({ title: 'Alerta marcada como leída', color: 'blue' })
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const handleResolver = async (id) => {
    try {
      await api.put(`/alertas/${id}/resolver`)
      setData(data.map(a => a.id === id ? { ...a, resuelta: true, leida: true } : a))
      notifications.show({ title: 'Alerta resuelta', color: 'green' })
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const handleGenerar = async () => {
    setLoading(true)
    try {
      await api.post('/alertas/generar')
      await loadData()
      notifications.show({ title: 'Alertas regeneradas', color: 'green' })
    } catch { notifications.show({ title: 'Error', color: 'red' }) }
    setLoading(false)
  }

  const sinLeer = data.filter(a => !a.leida).length
  const criticas = data.filter(a => a.severidad === 'critica' && !a.resuelta).length
  const resueltasHoy = data.filter(a => a.resuelta && dayjs(a.resuelta_en).isSame(dayjs(), 'day')).length

  return (
    <Stack>
      <Title order={3}>Centro de Notificaciones y Alertas</Title>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <IconBell size={28} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="xs" c="dimmed">Sin leer</Text>
              <Text size="xl" fw={700}>{sinLeer}</Text>
            </div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <IconAlertTriangle size={28} color="var(--mantine-color-red-6)" />
            <div>
              <Text size="xs" c="dimmed">Críticas sin resolver</Text>
              <Text size="xl" fw={700} c="red">{criticas}</Text>
            </div>
          </Group>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Group>
            <IconCheck size={28} color="var(--mantine-color-green-6)" />
            <div>
              <Text size="xs" c="dimmed">Resueltas hoy</Text>
              <Text size="xl" fw={700} c="green">{resueltasHoy}</Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Paper p="sm" radius="md" withBorder>
          <Group>
            <IconBrandTelegram size={24} color={channels.telegram ? 'var(--mantine-color-blue-6)' : 'gray'} />
            <div>
              <Text size="xs" c="dimmed">Telegram</Text>
              <Badge color={channels.telegram ? 'green' : 'gray'} size="sm" variant="light">
                {channels.telegram ? 'Configurado' : 'No configurado'}
              </Badge>
            </div>
          </Group>
        </Paper>
        <Paper p="sm" radius="md" withBorder>
          <Group>
            <IconMail size={24} color={channels.email ? 'var(--mantine-color-blue-6)' : 'gray'} />
            <div>
              <Text size="xs" c="dimmed">Email</Text>
              <Badge color={channels.email ? 'green' : 'gray'} size="sm" variant="light">
                {channels.email ? 'Configurado' : 'No configurado'}
              </Badge>
            </div>
          </Group>
        </Paper>
        <Paper p="sm" radius="md" withBorder>
          <Group>
            <IconBrandWhatsapp size={24} color={channels.whatsapp ? 'var(--mantine-color-green-6)' : 'gray'} />
            <div>
              <Text size="xs" c="dimmed">WhatsApp</Text>
              <Badge color={channels.whatsapp ? 'green' : 'gray'} size="sm" variant="light">
                {channels.whatsapp ? 'Configurado' : 'No configurado'}
              </Badge>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>

      <Tabs defaultValue="alertas">
        <Tabs.List>
          <Tabs.Tab value="alertas" leftSection={<IconBell size={16} />}>
            Alertas {sinLeer > 0 && <Badge size="xs" ml={4}>{sinLeer}</Badge>}
          </Tabs.Tab>
          <Tabs.Tab value="telegram" leftSection={<IconBrandTelegram size={16} />}>Telegram</Tabs.Tab>
          <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>Email</Tabs.Tab>
          <Tabs.Tab value="whatsapp" leftSection={<IconBrandWhatsapp size={16} />}>WhatsApp</Tabs.Tab>
          <Tabs.Tab value="webhooks" leftSection={<IconSend size={16} />}>Webhooks</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="alertas" pt="md">
          <TabAlertas data={data} loading={loading} filters={filters} setFilters={setFilters}
            handleLeer={handleLeer} handleResolver={handleResolver} handleGenerar={handleGenerar} />
        </Tabs.Panel>
        <Tabs.Panel value="telegram" pt="md"><TabTelegram /></Tabs.Panel>
        <Tabs.Panel value="email" pt="md"><TabEmail /></Tabs.Panel>
        <Tabs.Panel value="whatsapp" pt="md"><TabWhatsApp /></Tabs.Panel>
        <Tabs.Panel value="webhooks" pt="md"><TabWebhooks /></Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
