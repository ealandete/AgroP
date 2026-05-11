import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paper, Table, Title, Group, Button, Modal, TextInput, Select, NumberInput, Badge, ActionIcon, Stack, SimpleGrid, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconSearch, IconStethoscope, IconFileDescription, IconFileDownload } from '@tabler/icons-react'
import api from '../services/api.js'
import { formatCOP, formatNumber } from '../config.js'

const ESPECIES_LIST = ['bovino','bufalino','porcino','aviar','caprino','ovino','equino']

const ESTADOS_ORIGEN = [
  { value: 'propio', label: 'Propio', color: 'blue' },
  { value: 'prestamo', label: 'Préstamo', color: 'orange' },
  { value: 'adopcion', label: 'Adopción', color: 'grape' },
  { value: 'consignacion', label: 'Consignación', color: 'cyan' },
]

export default function Animales() {
  const navigate = useNavigate()
  const [animales, setAnimales] = useState([])
  const [razas, setRazas] = useState([])
  const [grupos, setGrupos] = useState([])
  const [eventos, setEventos] = useState([])
  const [selected, setSelected] = useState(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [eventOpened, { open: openEv, close: closeEv }] = useDisclosure(false)
  const [editando, setEditando] = useState(null)
  const [search, setSearch] = useState('')
  const [filtroEspecie, setFiltroEspecie] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [form, setForm] = useState({ especie:'bovino', sexo:'H', codigo:'', nombre:'', raza_id:'', lote_id:'', grupo_manejo_id:'', peso_kg:'', color:'', fecha_nacimiento:'', fecha_ingreso: new Date().toISOString().split('T')[0], numero_chapeta:'', tiene_chapeta:false, microchip_id:'', estado_origen:'propio' })

  const loadData = () => {
    api.get('/animales/').then(r => setAnimales(r.data)).catch(() => {})
    api.get('/animales/razas/').then(r => setRazas(r.data)).catch(() => {})
    api.get('/grupos-manejo/').then(r => setGrupos(r.data)).catch(() => {})
  }
  useEffect(loadData, [])

  const loadEventos = (id) => { api.get(`/animales/${id}/eventos`).then(r => setEventos(r.data)).catch(() => {}) }

  const filtered = animales.filter(a => {
    if (search && !(a.codigo||'').toLowerCase().includes(search.toLowerCase()) && !(a.nombre||'').toLowerCase().includes(search.toLowerCase())) return false
    if (filtroEspecie && a.especie !== filtroEspecie) return false
    if (filtroGrupo && a.grupo_manejo_id !== parseInt(filtroGrupo)) return false
    return true
  })

  const handleSubmit = async () => {
    try {
      if (editando) { await api.put(`/animales/${editando}`, form) }
      else { await api.post('/animales/', form) }
      notifications.show({ title: editando ? 'Actualizado' : 'Creado', color: 'green' })
      close(); setEditando(null); loadData()
    } catch (err) { notifications.show({ title: 'Error', color: 'red' }) }
  }

  const openEdit = (a) => {
    setEditando(a.id)
    setForm({ especie:a.especie||'bovino', sexo:a.sexo||'H', codigo:a.codigo||'', nombre:a.nombre||'', raza_id:a.raza_id?.toString()||'', lote_id:a.lote_id?.toString()||'', grupo_manejo_id:a.grupo_manejo_id?.toString()||'', peso_kg:a.peso_kg||'', color:a.color||'', fecha_nacimiento:a.fecha_nacimiento||'', fecha_ingreso:a.fecha_ingreso||new Date().toISOString().split('T')[0], numero_chapeta:a.numero_chapeta||'', tiene_chapeta:a.tiene_chapeta||false, microchip_id:a.microchip_id||'', estado_origen:a.estado_origen||'propio' })
    open()
  }

  const handleExportCSV = () => {
    const headers = ['codigo','nombre','especie','sexo','peso','activo']
    const rows = filtered.map(a => [
      a.codigo ? `"${a.codigo}"` : '',
      a.nombre ? `"${a.nombre}"` : '',
      a.especie || '',
      a.sexo || '',
      a.peso_kg || '',
      a.activo ? 'Si' : 'No',
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'animales.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Animales ({filtered.length})</Title>
        <Group>
          <Button leftSection={<IconFileDownload size={16} />} variant="default" onClick={handleExportCSV}>Exportar</Button>
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditando(null); setForm({...form,codigo:'',nombre:''}); open() }}>Nuevo</Button>
        </Group>
      </Group>

      <Group>
        <TextInput placeholder="Buscar..." leftSection={<IconSearch size={16} />} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <Select placeholder="Especie" data={ESPECIES_LIST} value={filtroEspecie} onChange={v => setFiltroEspecie(v||'')} clearable w={150} />
        <Select placeholder="Grupo" data={grupos.map(g => ({ value: g.id.toString(), label: g.nombre }))} value={filtroGrupo} onChange={v => setFiltroGrupo(v||'')} clearable w={180} />
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead><Table.Tr><Table.Th>Código</Table.Th><Table.Th>Nombre</Table.Th><Table.Th>Especie</Table.Th><Table.Th>Raza</Table.Th><Table.Th>Sexo</Table.Th><Table.Th>Peso</Table.Th><Table.Th>Chapeta</Table.Th><Table.Th>Estado</Table.Th><Table.Th>Origen</Table.Th><Table.Th>Acciones</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>
            {filtered.map(a => {
              const grupoNombre = grupos.find(g => g.id === a.grupo_manejo_id)?.nombre || ''
              return (
                <Table.Tr key={a.id}>
                  <Table.Td fw={500}>{a.codigo}</Table.Td>
                  <Table.Td>{a.nombre||'-'}</Table.Td>
                  <Table.Td>{a.especie}</Table.Td>
                  <Table.Td>{razas.find(r=>r.id===a.raza_id)?.nombre||'-'}</Table.Td>
                  <Table.Td><Badge size="sm" color={a.sexo==='H'?'pink':'blue'}>{a.sexo==='H'?'H':'M'}</Badge></Table.Td>
                  <Table.Td>{a.peso_kg?formatNumber(a.peso_kg):'-'}</Table.Td>
                  <Table.Td>{a.tiene_chapeta && a.numero_chapeta ? <Badge size="sm" variant="outline">{a.numero_chapeta}</Badge> : '-'}</Table.Td>
                  <Table.Td><Badge size="sm" color={a.activo?'green':'red'}>{a.activo?'Activo':'Inactivo'}</Badge></Table.Td>
                  <Table.Td>
                    {(() => {
                      const est = ESTADOS_ORIGEN.find(e => e.value === a.estado_origen)
                      return est ? <Badge size="sm" color={est.color} variant="light">{est.label}</Badge> : <Badge size="sm" color="blue" variant="light">Propio</Badge>
                    })()}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon variant="light" color="blue" onClick={() => openEdit(a)}><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="light" color="teal" onClick={() => navigate(`/ficha-animal?id=${a.id}`)}><IconFileDescription size={16} /></ActionIcon>
                      <ActionIcon variant="light" color="cyan" onClick={() => { setSelected(a); loadEventos(a.id); openEv() }}><IconStethoscope size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      <Modal opened={opened} onClose={close} title={editando?'Editar':'Nuevo'} size="lg">
        <SimpleGrid cols={2}>
          <TextInput label="Código" value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})} required />
          <TextInput label="Nombre" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} />
          <Select label="Especie" data={ESPECIES_LIST} value={form.especie} onChange={v=>setForm({...form,especie:v})} />
          <Select label="Sexo" data={[{value:'H',label:'Hembra'},{value:'M',label:'Macho'}]} value={form.sexo} onChange={v=>setForm({...form,sexo:v})} />
          <Select label="Raza" data={razas.filter(r=>r.especie===form.especie).map(r=>({value:r.id.toString(),label:r.nombre}))} value={form.raza_id} onChange={v=>setForm({...form,raza_id:v})} clearable />
          <Select label="Grupo Manejo" data={grupos.map(g=>({value:g.id.toString(),label:g.nombre}))} value={form.grupo_manejo_id} onChange={v=>setForm({...form,grupo_manejo_id:v})} clearable />
          <Select label="Origen" data={ESTADOS_ORIGEN.map(e=>({value:e.value,label:e.label}))} value={form.estado_origen||'propio'} onChange={v=>setForm({...form,estado_origen:v})} />
          <TextInput label="Nro Chapeta" value={form.numero_chapeta} onChange={e=>setForm({...form,numero_chapeta:e.target.value})} />
          <TextInput label="Microchip" value={form.microchip_id} onChange={e=>setForm({...form,microchip_id:e.target.value})} />
          <TextInput label="Color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} />
          <NumberInput label="Peso (kg)" value={form.peso_kg} onChange={v=>setForm({...form,peso_kg:v})} />
          <TextInput label="F. Nacimiento" type="date" value={form.fecha_nacimiento} onChange={e=>setForm({...form,fecha_nacimiento:e.target.value})} />
          <TextInput label="F. Ingreso" type="date" value={form.fecha_ingreso} onChange={e=>setForm({...form,fecha_ingreso:e.target.value})} required />
        </SimpleGrid>
        <Group justify="flex-end" mt="xl"><Button variant="default" onClick={close}>Cancelar</Button><Button onClick={handleSubmit}>{editando?'Guardar':'Crear'}</Button></Group>
      </Modal>

      <Modal opened={eventOpened} onClose={closeEv} title={`Eventos: ${selected?.nombre||selected?.codigo||''}`} size="lg">
        <Table><Table.Thead><Table.Tr><Table.Th>Fecha</Table.Th><Table.Th>Tipo</Table.Th><Table.Th>Diagnóstico</Table.Th><Table.Th>Costo</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{eventos.map(e=>(<Table.Tr key={e.id}><Table.Td>{e.fecha}</Table.Td><Table.Td><Badge size="sm">{e.tipo_evento}</Badge></Table.Td><Table.Td>{e.diagnostico||'-'}</Table.Td><Table.Td>{e.costo?formatCOP(e.costo):'-'}</Table.Td></Table.Tr>))}
        {eventos.length===0&&<Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">Sin eventos</Text></Table.Td></Table.Tr>}</Table.Tbody></Table>
      </Modal>
    </Stack>
  )
}
