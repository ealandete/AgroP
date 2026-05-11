import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, NumberInput, Badge, Stack, SimpleGrid, Text, ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconSearch, IconUser } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP } from '../config.js'

function validateTrabajadorForm(form) {
  const errors = {}
  if (!form.nombre?.trim()) errors.nombre = 'El nombre es obligatorio'
  if (!form.numero_documento?.trim()) errors.numero_documento = 'El número de documento es obligatorio'
  if (!form.cargo) errors.cargo = 'El cargo es obligatorio'
  return errors
}

export default function Trabajadores() {
  const [data, setData] = useState([])
  const [opened, { open, close }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    tipo_documento: 'CC', numero_documento: '', nombre: '', apellido: '',
    fecha_nacimiento: '', telefono: '', email: '', direccion: '',
    cargo: 'operario_campo', tipo_contrato: 'indefinido',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    salario_base: '', tipo_salario: 'mensual',
    eps: '', arl: '', fondo_pension: '', estado: 'activo',
  })

  const loadData = () => {
    api.get('/personal/').then(r => setData(r.data)).catch(() => {
      console.log('Mock GET /api/personal/')
      setData([])
    })
  }
  useEffect(loadData, [])

  const filtered = data.filter(p =>
    `${p.nombre || ''} ${p.apellido || ''} ${p.numero_documento || ''} ${p.cargo || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => {
    setForm({
      tipo_documento: 'CC', numero_documento: '', nombre: '', apellido: '',
      fecha_nacimiento: '', telefono: '', email: '', direccion: '',
      cargo: 'operario_campo', tipo_contrato: 'indefinido',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      salario_base: '', tipo_salario: 'mensual',
      eps: '', arl: '', fondo_pension: '', estado: 'activo',
    })
  }

  const isFormValid = Object.keys(validateTrabajadorForm(form)).length === 0

  const setAndValidate = (field, value) => {
    const updated = { ...form, [field]: value }
    setForm(updated)
    const newErrors = { ...errors }
    const allErrors = validateTrabajadorForm(updated)
    if (allErrors[field]) newErrors[field] = allErrors[field]
    else delete newErrors[field]
    setErrors(newErrors)
  }

  const handleSubmit = async () => {
    const validationErrors = validateTrabajadorForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    try {
      const payload = { ...form, salario_base: parseFloat(form.salario_base) || 0 }
      if (editando) {
        await api.put(`/personal/${editando}`, payload)
        notifications.show({ title: 'Trabajador actualizado', color: 'green' })
      } else {
        await api.post('/personal/', payload)
        notifications.show({ title: 'Trabajador creado', color: 'green' })
      }
      close()
      setEditando(null)
      resetForm()
      setErrors({})
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const handleEdit = (p) => {
    setEditando(p.id)
    setForm({
      tipo_documento: p.tipo_documento || 'CC',
      numero_documento: p.numero_documento || '',
      nombre: p.nombre || '',
      apellido: p.apellido || '',
      fecha_nacimiento: p.fecha_nacimiento || '',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || '',
      cargo: p.cargo || 'operario_campo',
      tipo_contrato: p.tipo_contrato || 'indefinido',
      fecha_ingreso: p.fecha_ingreso || new Date().toISOString().split('T')[0],
      salario_base: p.salario_base?.toString() || '',
      tipo_salario: p.tipo_salario || 'mensual',
      eps: p.eps || '',
      arl: p.arl || '',
      fondo_pension: p.fondo_pension || '',
      estado: p.estado || 'activo',
    })
    setErrors({})
    open()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este trabajador?')) return
    try {
      await api.delete(`/personal/${id}`)
      notifications.show({ title: 'Trabajador eliminado', color: 'red' })
      loadData()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const cargoOptions = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'veterinario', label: 'Veterinario' },
    { value: 'agronomo', label: 'Agrónomo' },
    { value: 'operario_campo', label: 'Operario de Campo' },
    { value: 'ordenador', label: 'Ordenador' },
    { value: 'vaquero', label: 'Vaquero' },
    { value: 'jardinero', label: 'Jardinero' },
    { value: 'vigilante', label: 'Vigilante' },
    { value: 'conductor', label: 'Conductor' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'otro', label: 'Otro' },
  ]

  const contratoOptions = [
    { value: 'indefinido', label: 'Indefinido' },
    { value: 'fijo', label: 'Fijo' },
    { value: 'obra_labor', label: 'Obra/Labor' },
    { value: 'prestacion_servicios', label: 'Prestación de Servicios' },
    { value: 'ocasional', label: 'Ocasional' },
  ]

  const activos = data.filter(p => p.estado !== 'inactivo').length

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Trabajadores</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); resetForm(); setErrors({}); open() }}>
          Nuevo Trabajador
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        <Paper withBorder p="md">
          <Group><IconUser size={18} /><Text size="xs" c="dimmed">Total Trabajadores</Text></Group>
          <Text fw={700} size="xl">{data.length}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">Activos</Text>
          <Text fw={700} size="xl" c="green">{activos}</Text>
        </Paper>
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed">Inactivos</Text>
          <Text fw={700} size="xl" c="red">{data.length - activos}</Text>
        </Paper>
      </SimpleGrid>

      <TextInput
        placeholder="Buscar por nombre, documento o cargo..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <Paper withBorder style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Documento</Table.Th>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Cargo</Table.Th>
              <Table.Th visibleFrom="sm">Teléfono</Table.Th>
              <Table.Th visibleFrom="sm">Email</Table.Th>
              <Table.Th visibleFrom="sm">Fecha Ingreso</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th style={{ width: 80 }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td fw={500}>{p.tipo_documento} {p.numero_documento}</Table.Td>
                <Table.Td>{p.nombre} {p.apellido}</Table.Td>
                <Table.Td><Badge size="sm" variant="light">{cargoOptions.find(c => c.value === p.cargo)?.label || p.cargo}</Badge></Table.Td>
                <Table.Td visibleFrom="sm">{p.telefono || '-'}</Table.Td>
                <Table.Td visibleFrom="sm">{p.email || '-'}</Table.Td>
                <Table.Td visibleFrom="sm">{p.fecha_ingreso}</Table.Td>
                <Table.Td>
                  <Badge color={p.estado === 'activo' ? 'green' : 'red'} size="sm">{p.estado}</Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="light" color="blue" onClick={() => handleEdit(p)}><IconEdit size={16} /></ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => handleDelete(p.id)}><IconTrash size={16} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {filtered.length === 0 && (
              <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center">Sin trabajadores registrados</Text></Table.Td></Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando ? 'Editar Trabajador' : 'Nuevo Trabajador'} size="xl">
        <Stack>
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Select label="Tipo Documento *" data={[
              { value: 'CC', label: 'CC' },
              { value: 'CE', label: 'CE' },
              { value: 'PP', label: 'PP' },
              { value: 'NIT', label: 'NIT' },
            ]} value={form.tipo_documento} onChange={v => setForm({ ...form, tipo_documento: v })} />
            <TextInput label="Número Documento *" value={form.numero_documento} onChange={e => setAndValidate('numero_documento', e.target.value)} required error={errors.numero_documento} />
            <TextInput label="Fecha Nacimiento" type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Nombre *" value={form.nombre} onChange={e => setAndValidate('nombre', e.target.value)} required error={errors.nombre} />
            <TextInput label="Apellido *" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} required />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            <TextInput label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </SimpleGrid>
          <TextInput label="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Select label="Cargo *" data={cargoOptions} value={form.cargo} onChange={v => setAndValidate('cargo', v)} required error={errors.cargo} />
            <Select label="Tipo Contrato *" data={contratoOptions} value={form.tipo_contrato} onChange={v => setForm({ ...form, tipo_contrato: v })} />
            <TextInput label="Fecha Ingreso *" type="date" value={form.fecha_ingreso} onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })} required />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <NumberInput label="Salario Base" value={form.salario_base} onChange={v => setForm({ ...form, salario_base: v })} min={0} prefix="$ " />
            <Select label="Tipo Salario" data={[
              { value: 'mensual', label: 'Mensual' },
              { value: 'quincenal', label: 'Quincenal' },
              { value: 'jornal', label: 'Jornal' },
              { value: 'hora', label: 'Por Hora' },
            ]} value={form.tipo_salario} onChange={v => setForm({ ...form, tipo_salario: v })} />
            <Select label="Estado" data={[
              { value: 'activo', label: 'Activo' },
              { value: 'inactivo', label: 'Inactivo' },
            ]} value={form.estado} onChange={v => setForm({ ...form, estado: v })} />
          </SimpleGrid>
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <TextInput label="EPS" value={form.eps} onChange={e => setForm({ ...form, eps: e.target.value })} />
            <TextInput label="ARL" value={form.arl} onChange={e => setForm({ ...form, arl: e.target.value })} />
            <TextInput label="Fondo Pensión" value={form.fondo_pension} onChange={e => setForm({ ...form, fondo_pension: e.target.value })} />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!isFormValid}>{editando ? 'Actualizar' : 'Guardar'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
