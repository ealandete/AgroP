import { useState, useEffect } from 'react'
import { Modal, Button, TextInput, Select, NumberInput, Group, Stack, Text, SimpleGrid, Checkbox, Paper, Loader } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck } from '@tabler/icons-react'
import api from '../services/api.js'
import { ESPECIES } from '../config.js'

const ESPECIES_EMOJI = {
  bovino: '🐮', bufalino: '🐃', porcino: '🐷', aviar: '🐔',
  caprino: '🐐', ovino: '🐑', equino: '🐴', canino: '🐕',
  felino: '🐈', conejo: '🐰', chiguiro: '🦫', cuy: '🐹',
}

const EVENTO_TIPOS = [
  { value: 'vacuna', label: '💉 Vacuna', color: 'blue' },
  { value: 'enfermedad', label: '🩺 Enfermedad', color: 'red' },
  { value: 'desparasitar', label: '🪱 Desparasitar', color: 'orange' },
]

function useAnimals() {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/animales/').then(r => setAnimals(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])
  return { animals, loading }
}

function AnimalSelect({ value, onChange, label, required }) {
  const { animals, loading } = useAnimals()
  return (
    <Select
      label={label || 'Animal'}
      placeholder={loading ? 'Cargando...' : 'Buscar animal...'}
      data={animals.map(a => ({ value: a.id.toString(), label: `${a.codigo} ${a.nombre ? '- ' + a.nombre : ''} (${a.especie})` }))}
      value={value}
      onChange={onChange}
      searchable
      nothingFoundMessage="No se encontró el animal"
      size="lg"
      required={required}
    />
  )
}

function SuccessState({ onOtro, onClose, message }) {
  return (
    <Stack align="center" py="xl" gap="lg">
      <Text className="success-check">✅</Text>
      <Text size="xl" fw={700}>{message || '¡Registrado!'}</Text>
      <Group mt="md">
        <Button size="lg" color="green" onClick={onOtro}>Registrar otro</Button>
        <Button size="lg" variant="default" onClick={onClose}>Cerrar</Button>
      </Group>
    </Stack>
  )
}

export function QuickAnimalForm({ opened, onClose }) {
  const [form, setForm] = useState({ codigo: '', especie: 'bovino', sexo: 'H' })
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!opened) {
      setSuccess(false)
      setForm({ codigo: '', especie: 'bovino', sexo: 'H' })
    }
  }, [opened])

  const handleSubmit = async () => {
    if (!form.codigo.trim()) { notifications.show({ title: 'Error', message: 'El código es obligatorio', color: 'red' }); return }
    setSaving(true)
    try {
      await api.post('/animales/', form)
      setSuccess(true)
    } catch { notifications.show({ title: 'Error', message: 'No se pudo registrar', color: 'red' })
    } finally { setSaving(false) }
  }

  const resetForm = () => {
    setForm({ codigo: '', especie: 'bovino', sexo: 'H' })
    setSuccess(false)
  }

  if (success) return <Modal opened={opened} onClose={onClose} title="Registrar animal" centered><SuccessState onOtro={resetForm} onClose={onClose} /></Modal>

  return (
    <Modal opened={opened} onClose={onClose} title="🐮 Registrar animal" centered size="sm">
      <Stack gap="md" py="sm">
        <TextInput
          label="Código"
          placeholder="Ej: V-001"
          value={form.codigo}
          onChange={e => setForm({ ...form, codigo: e.target.value })}
          size="lg"
          styles={{ input: { fontSize: 20 } }}
          required
        />
        <Select
          label="Especie"
          data={ESPECIES.map(e => ({ value: e, label: `${ESPECIES_EMOJI[e] || '🐾'} ${e.charAt(0).toUpperCase() + e.slice(1)}` }))}
          value={form.especie}
          onChange={v => setForm({ ...form, especie: v })}
          size="lg"
        />
        <Text size="sm" fw={500}>Sexo</Text>
        <Group grow>
          <Button
            size="xl"
            variant={form.sexo === 'H' ? 'filled' : 'outline'}
            color="pink"
            onClick={() => setForm({ ...form, sexo: 'H' })}
            styles={{ label: { fontSize: 28 } }}
          >
            ♀️ Hembra
          </Button>
          <Button
            size="xl"
            variant={form.sexo === 'M' ? 'filled' : 'outline'}
            color="blue"
            onClick={() => setForm({ ...form, sexo: 'M' })}
            styles={{ label: { fontSize: 28 } }}
          >
            ♂️ Macho
          </Button>
        </Group>
        <Button size="lg" fullWidth onClick={handleSubmit} loading={saving} mt="sm" styles={{ label: { fontSize: 18 } }}>
          ✅ Registrar
        </Button>
      </Stack>
    </Modal>
  )
}

export function QuickEventForm({ opened, onClose }) {
  const [form, setForm] = useState({ animal_id: '', tipo_evento: 'vacuna', fecha: new Date().toISOString().split('T')[0] })
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!opened) {
      setSuccess(false)
      setForm({ animal_id: '', tipo_evento: 'vacuna', fecha: new Date().toISOString().split('T')[0] })
    }
  }, [opened])

  const handleSubmit = async () => {
    if (!form.animal_id) { notifications.show({ title: 'Error', message: 'Seleccione un animal', color: 'red' }); return }
    setSaving(true)
    try {
      await api.post(`/animales/${form.animal_id}/eventos/`, form)
      setSuccess(true)
    } catch { notifications.show({ title: 'Error', message: 'No se pudo registrar el evento', color: 'red' })
    } finally { setSaving(false) }
  }

  const resetForm = () => {
    setForm({ animal_id: '', tipo_evento: 'vacuna', fecha: new Date().toISOString().split('T')[0] })
    setSuccess(false)
  }

  if (success) return <Modal opened={opened} onClose={onClose} title="Registrar evento" centered><SuccessState onOtro={resetForm} onClose={onClose} /></Modal>

  return (
    <Modal opened={opened} onClose={onClose} title="💉 Registrar evento" centered size="sm">
      <Stack gap="md" py="sm">
        <AnimalSelect value={form.animal_id} onChange={v => setForm({ ...form, animal_id: v })} required />
        <Text size="sm" fw={500}>Tipo de evento</Text>
        <SimpleGrid cols={3} spacing="xs">
          {EVENTO_TIPOS.map(t => (
            <Button
              key={t.value}
              variant={form.tipo_evento === t.value ? 'filled' : 'outline'}
              color={t.color}
              onClick={() => setForm({ ...form, tipo_evento: t.value })}
              styles={{ label: { fontSize: 14 }, root: { minHeight: 70 } }}
            >
              <Stack gap={2} align="center">
                <Text size="xl">{t.label.split(' ')[0]}</Text>
                <Text size="xs">{t.label.split(' ')[1]}</Text>
              </Stack>
            </Button>
          ))}
        </SimpleGrid>
        <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} size="lg" />
        <Button size="lg" fullWidth onClick={handleSubmit} loading={saving} mt="sm" styles={{ label: { fontSize: 18 } }}>
          ✅ Registrar
        </Button>
      </Stack>
    </Modal>
  )
}

export function QuickWeightForm({ opened, onClose }) {
  const [form, setForm] = useState({ animal_id: '', peso_kg: '' })
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!opened) {
      setSuccess(false)
      setForm({ animal_id: '', peso_kg: '' })
    }
  }, [opened])

  const handleSubmit = async () => {
    if (!form.animal_id) { notifications.show({ title: 'Error', message: 'Seleccione un animal', color: 'red' }); return }
    if (!form.peso_kg || Number(form.peso_kg) <= 0) { notifications.show({ title: 'Error', message: 'Ingrese un peso válido', color: 'red' }); return }
    setSaving(true)
    try {
      await api.post('/pesajes/', form)
      setSuccess(true)
    } catch { notifications.show({ title: 'Error', message: 'No se pudo registrar el peso', color: 'red' })
    } finally { setSaving(false) }
  }

  const resetForm = () => {
    setForm({ animal_id: '', peso_kg: '' })
    setSuccess(false)
  }

  if (success) return <Modal opened={opened} onClose={onClose} title="Registrar peso" centered><SuccessState onOtro={resetForm} onClose={onClose} /></Modal>

  return (
    <Modal opened={opened} onClose={onClose} title="📏 Registrar peso" centered size="sm">
      <Stack gap="md" py="sm">
        <AnimalSelect value={form.animal_id} onChange={v => setForm({ ...form, animal_id: v })} required />
        <NumberInput
          label="Peso (kg)"
          placeholder="Ej: 450"
          value={form.peso_kg}
          onChange={v => setForm({ ...form, peso_kg: v })}
          size="lg"
          min={0}
          step={0.1}
          required
          styles={{ input: { fontSize: 24, fontWeight: 700 } }}
        />
        <Button size="lg" fullWidth onClick={handleSubmit} loading={saving} mt="sm" styles={{ label: { fontSize: 18 } }}>
          ✅ Registrar
        </Button>
      </Stack>
    </Modal>
  )
}

export function QuickMilkForm({ opened, onClose }) {
  const [form, setForm] = useState({ animal_id: '', cantidad_litros: '', turno: 'mañana' })
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!opened) {
      setSuccess(false)
      setForm({ animal_id: '', cantidad_litros: '', turno: 'mañana' })
    }
  }, [opened])

  const handleSubmit = async () => {
    if (!form.animal_id) { notifications.show({ title: 'Error', message: 'Seleccione un animal', color: 'red' }); return }
    if (!form.cantidad_litros || Number(form.cantidad_litros) <= 0) { notifications.show({ title: 'Error', message: 'Ingrese una cantidad válida', color: 'red' }); return }
    setSaving(true)
    try {
      await api.post('/lactancias/', form)
      setSuccess(true)
    } catch { notifications.show({ title: 'Error', message: 'No se pudo registrar la leche', color: 'red' })
    } finally { setSaving(false) }
  }

  const resetForm = () => {
    setForm({ animal_id: '', cantidad_litros: '', turno: 'mañana' })
    setSuccess(false)
  }

  if (success) return <Modal opened={opened} onClose={onClose} title="Registrar leche" centered><SuccessState onOtro={resetForm} onClose={onClose} /></Modal>

  return (
    <Modal opened={opened} onClose={onClose} title="🥛 Registrar leche" centered size="sm">
      <Stack gap="md" py="sm">
        <AnimalSelect value={form.animal_id} onChange={v => setForm({ ...form, animal_id: v })} required />
        <NumberInput
          label="Cantidad (litros)"
          placeholder="Ej: 12.5"
          value={form.cantidad_litros}
          onChange={v => setForm({ ...form, cantidad_litros: v })}
          size="lg"
          min={0}
          step={0.1}
          required
          styles={{ input: { fontSize: 24, fontWeight: 700 } }}
        />
        <Text size="sm" fw={500}>Turno</Text>
        <Group grow>
          <Button
            size="xl"
            variant={form.turno === 'mañana' ? 'filled' : 'outline'}
            color="yellow"
            onClick={() => setForm({ ...form, turno: 'mañana' })}
            styles={{ label: { fontSize: 20 } }}
          >
            🌅 Mañana
          </Button>
          <Button
            size="xl"
            variant={form.turno === 'tarde' ? 'filled' : 'outline'}
            color="orange"
            onClick={() => setForm({ ...form, turno: 'tarde' })}
            styles={{ label: { fontSize: 20 } }}
          >
            🌇 Tarde
          </Button>
        </Group>
        <Button size="lg" fullWidth onClick={handleSubmit} loading={saving} mt="sm" styles={{ label: { fontSize: 18 } }}>
          ✅ Registrar
        </Button>
      </Stack>
    </Modal>
  )
}

export function QuickSiembraForm({ opened, onClose }) {
  const [form, setForm] = useState({ cultivo: '', lote_id: '', fecha: new Date().toISOString().split('T')[0] })
  const [lotes, setLotes] = useState([])
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(true)

  const TIPOS_CULTIVO = ['maiz', 'arroz', 'frijol', 'cafe', 'cacao', 'platano', 'yuca', 'papa', 'sorgo', 'pastura']
  const CULTIVO_EMOJI = { maiz: '🌽', arroz: '🌾', frijol: '🫘', cafe: '☕', cacao: '🍫', platano: '🍌', yuca: '🥔', papa: '🥔', sorgo: '🌾', pastura: '🌿' }

  useEffect(() => {
    api.get('/lotes/').then(r => setLotes(r.data)).catch(() => {}).finally(() => setLoadingLotes(false))
  }, [])

  useEffect(() => {
    if (!opened) {
      setSuccess(false)
      setForm({ cultivo: '', lote_id: '', fecha: new Date().toISOString().split('T')[0] })
    }
  }, [opened])

  const handleSubmit = async () => {
    if (!form.cultivo) { notifications.show({ title: 'Error', message: 'Seleccione un cultivo', color: 'red' }); return }
    if (!form.lote_id) { notifications.show({ title: 'Error', message: 'Seleccione un lote', color: 'red' }); return }
    setSaving(true)
    try {
      await api.post('/cultivos/siembras/', form)
      setSuccess(true)
    } catch { notifications.show({ title: 'Error', message: 'No se pudo registrar la siembra', color: 'red' })
    } finally { setSaving(false) }
  }

  const resetForm = () => {
    setForm({ cultivo: '', lote_id: '', fecha: new Date().toISOString().split('T')[0] })
    setSuccess(false)
  }

  if (success) return <Modal opened={opened} onClose={onClose} title="Registrar siembra" centered><SuccessState onOtro={resetForm} onClose={onClose} /></Modal>

  return (
    <Modal opened={opened} onClose={onClose} title="🌱 Registrar siembra" centered size="sm">
      <Stack gap="md" py="sm">
        <Select
          label="Cultivo"
          placeholder="Seleccione cultivo"
          data={TIPOS_CULTIVO.map(c => ({ value: c, label: `${CULTIVO_EMOJI[c] || '🌱'} ${c.charAt(0).toUpperCase() + c.slice(1)}` }))}
          value={form.cultivo}
          onChange={v => setForm({ ...form, cultivo: v })}
          size="lg"
          searchable
          required
        />
        <Select
          label="Lote"
          placeholder={loadingLotes ? 'Cargando...' : 'Seleccione lote'}
          data={lotes.map(l => ({ value: l.id.toString(), label: l.nombre || `Lote #${l.id}` }))}
          value={form.lote_id}
          onChange={v => setForm({ ...form, lote_id: v })}
          size="lg"
          searchable
          required
        />
        <TextInput label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} size="lg" />
        <Button size="lg" fullWidth onClick={handleSubmit} loading={saving} mt="sm" styles={{ label: { fontSize: 18 } }}>
          ✅ Registrar
        </Button>
      </Stack>
    </Modal>
  )
}

export function QuickTaskForm({ opened, onClose }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (opened) {
      setLoading(true)
      api.get('/planeacion/tareas-hoy/').then(r => setTasks(r.data || [])).catch(() => setTasks([])).finally(() => setLoading(false))
    }
  }, [opened])

  const toggleTask = async (task) => {
    setUpdating(task.id)
    try {
      await api.patch(`/planeacion/tareas/${task.id}/`, { realizada: !task.realizada })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, realizada: !t.realizada } : t))
      notifications.show({ title: task.realizada ? 'Desmarcada' : 'Completada', color: task.realizada ? 'orange' : 'green', message: task.nombre || '' })
    } catch { notifications.show({ title: 'Error', color: 'red', message: 'No se pudo actualizar' })
    } finally { setUpdating(null) }
  }

  const pendientes = tasks.filter(t => !t.realizada)
  const completadas = tasks.filter(t => t.realizada)

  return (
    <Modal opened={opened} onClose={onClose} title="📋 Mis tareas de hoy" centered size="md">
      <Stack gap="sm" py="sm">
        {loading ? (
          <Group justify="center" py="xl"><Loader size="lg" /></Group>
        ) : tasks.length === 0 ? (
          <Text ta="center" c="dimmed" size="lg" py="xl">🎉 No hay tareas pendientes</Text>
        ) : (
          <>
            {pendientes.length > 0 && (
              <>
                <Text fw={600} c="orange">Pendientes ({pendientes.length})</Text>
                {pendientes.map(t => (
                  <Paper key={t.id} p="sm" withBorder>
                    <Checkbox
                      label={t.nombre || t.descripcion || `Tarea #${t.id}`}
                      checked={false}
                      onChange={() => toggleTask(t)}
                      disabled={updating === t.id}
                      size="lg"
                    />
                  </Paper>
                ))}
              </>
            )}
            {completadas.length > 0 && (
              <>
                <Text fw={600} c="green" mt="sm">Completadas ({completadas.length})</Text>
                {completadas.map(t => (
                  <Paper key={t.id} p="sm" withBorder bg="green.0">
                    <Checkbox
                      label={t.nombre || t.descripcion || `Tarea #${t.id}`}
                      checked={true}
                      onChange={() => toggleTask(t)}
                      disabled={updating === t.id}
                      size="lg"
                      color="green"
                    />
                  </Paper>
                ))}
              </>
            )}
          </>
        )}
        <Button size="lg" fullWidth variant="default" onClick={onClose} mt="sm">Cerrar</Button>
      </Stack>
    </Modal>
  )
}
