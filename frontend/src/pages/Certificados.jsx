import { useEffect, useState } from 'react'
import {
  Paper, Table, Title, Group, Button, Modal, TextInput,
  Select, Textarea, Badge, Stack, SimpleGrid, Text, Tabs, ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus, IconEdit, IconTruckDelivery, IconQrcode,
  IconIroning, IconCertificate, IconPrinter,
} from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

export default function Certificados() {
  const [activeTab, setActiveTab] = useState('traslado')
  const [animales, setAnimales] = useState([])
  const [fincas, setFincas] = useState([])
  const [hierros, setHierros] = useState([])
  const [traslados, setTraslados] = useState([])
  const [plantilla, setPlantilla] = useState(null)
  const [openedTraslado, { open: openTraslado, close: closeTraslado }] = useDisclosure(false)
  const [openedHierro, { open: openHierro, close: closeHierro }] = useDisclosure(false)
  const [editHierroId, setEditHierroId] = useState(null)
  const [certGenerado, setCertGenerado] = useState(null)
  const [formTraslado, setFormTraslado] = useState({
    animal_id: '', destino: '', motivo: '',
    transportista: '', placa_vehiculo: '', fecha_salida: '',
  })
  const [formHierro, setFormHierro] = useState({
    finca_id: '', numero_registro_ica: '', diseno: '',
    fecha_registro: '', activo: true,
  })

  const fincaActiva = localStorage.getItem('agrop_finca_id') || ''

  const loadAll = async () => {
    try {
      const [a, f, h, t, p] = await Promise.all([
        api.get('/animales/').catch(() => ({ data: [] })),
        api.get('/lotes/fincas/').catch(() => ({ data: [] })),
        fincaActiva ? api.get(`/certificados/hierros/${fincaActiva}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        api.get('/certificados/traslados').catch(() => ({ data: [] })),
        api.get('/certificados/plantilla-ica').catch(() => ({ data: null })),
      ])
      setAnimales(a.data)
      setFincas(f.data)
      setHierros(h.data)
      setTraslados(t.data)
      setPlantilla(p.data)
    } catch { }
  }

  useEffect(() => { loadAll() }, [fincaActiva])

  const generarCertificado = async () => {
    try {
      const res = await api.post('/certificados/traslado', {
        ...formTraslado,
        animal_id: parseInt(formTraslado.animal_id),
      })
      setCertGenerado(res.data)
      notifications.show({ title: 'Certificado generado', message: `Guía: ${res.data.numero_guia}`, color: 'green' })
      closeTraslado()
      setFormTraslado({ animal_id: '', destino: '', motivo: '', transportista: '', placa_vehiculo: '', fecha_salida: '' })
      loadAll()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const registrarHierro = async () => {
    try {
      const payload = { ...formHierro, finca_id: parseInt(formHierro.finca_id) }
      if (editHierroId) {
        await api.put(`/certificados/hierros/${editHierroId}`, payload)
        notifications.show({ title: 'Hierro actualizado', color: 'green' })
      } else {
        await api.post('/certificados/hierros', payload)
        notifications.show({ title: 'Hierro registrado', color: 'green' })
      }
      closeHierro()
      setEditHierroId(null)
      setFormHierro({ finca_id: '', numero_registro_ica: '', diseno: '', fecha_registro: '', activo: true })
      loadAll()
    } catch (err) {
      notifications.show({ title: 'Error', message: err.response?.data?.detail || 'Error', color: 'red' })
    }
  }

  const editarHierro = (h) => {
    setEditHierroId(h.id)
    setFormHierro({
      finca_id: h.finca_id.toString(),
      numero_registro_ica: h.numero_registro_ica,
      diseno: h.diseno,
      fecha_registro: h.fecha_registro,
      activo: h.activo,
    })
    openHierro()
  }

  return (
    <Stack>
      <Title order={3}>Certificados</Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="traslado" leftSection={<IconTruckDelivery size={16} />}>Traslado de Animales</Tabs.Tab>
          <Tabs.Tab value="hierros" leftSection={<IconIroning size={16} />}>Hierros de Marcación</Tabs.Tab>
          <Tabs.Tab value="plantilla" leftSection={<IconCertificate size={16} />}>Plantilla ICA</Tabs.Tab>
        </Tabs.List>

        {/* ─── Tab: Traslado de Animales ────────────────── */}
        <Tabs.Panel value="traslado" pt="md">
          <Group mb="md">
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setCertGenerado(null); openTraslado() }}>
              Nuevo Certificado de Traslado
            </Button>
          </Group>

          {certGenerado && (
            <Paper p="md" withBorder mb="md" bg="green.0">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>Certificado Generado</Text>
                  <Text size="sm">Guía: <Badge size="lg">{certGenerado.numero_guia}</Badge></Text>
                  <Text size="sm">Animal: {certGenerado.animal_codigo || certGenerado.animal_nombre || `#${certGenerado.animal_id}`}</Text>
                  <Text size="sm">Destino: {certGenerado.destino}</Text>
                  <Text size="sm">Transportista: {certGenerado.transportista} - Placa: {certGenerado.placa_vehiculo}</Text>
                  <Text size="xs" mt="xs" fs="italic">QR: {certGenerado.qr_data}</Text>
                </div>
                <Button variant="outline" leftSection={<IconQrcode size={16} />} onClick={() => {
                  const w = window.open('', '_blank')
                  w.document.write(`<html><body style="font-family:sans-serif;padding:40px;text-align:center"><h2>AgroP - Certificado de Traslado</h2><hr/><p><b>Guía:</b> ${certGenerado.numero_guia}</p><p><b>Animal:</b> ${certGenerado.animal_codigo || certGenerado.animal_nombre || `#${certGenerado.animal_id}`}</p><p><b>Destino:</b> ${certGenerado.destino}</p><p><b>Motivo:</b> ${certGenerado.motivo}</p><p><b>Transportista:</b> ${certGenerado.transportista}</p><p><b>Placa:</b> ${certGenerado.placa_vehiculo}</p><p><b>Fecha:</b> ${certGenerado.fecha_salida}</p><hr/><p style="font-size:20px"><b>${certGenerado.qr_data}</b></p><p style="color:gray">Código QR: ${certGenerado.qr_data}</p></body></html>`)
                  w.document.close()
                }}>Vista Preeliminar</Button>
              </Group>
            </Paper>
          )}

          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Guía</Table.Th>
                  <Table.Th>Animal</Table.Th>
                  <Table.Th>Destino</Table.Th>
                  <Table.Th>Motivo</Table.Th>
                  <Table.Th>Transportista</Table.Th>
                  <Table.Th>Placa</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {traslados.map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td fw={500}>{c.numero_guia}</Table.Td>
                    <Table.Td>{c.animal_codigo || c.animal_nombre || `#${c.animal_id}`}</Table.Td>
                    <Table.Td>{c.destino}</Table.Td>
                    <Table.Td>{c.motivo}</Table.Td>
                    <Table.Td>{c.transportista}</Table.Td>
                    <Table.Td>{c.placa_vehiculo}</Table.Td>
                    <Table.Td>{c.fecha_salida}</Table.Td>
                    <Table.Td><Badge color={c.estado === 'emitido' ? 'green' : 'red'} size="sm">{c.estado}</Badge></Table.Td>
                  </Table.Tr>
                ))}
                {traslados.length === 0 && (
                  <Table.Tr><Table.Td colSpan={8}><Text c="dimmed" ta="center" py="sm">No hay certificados de traslado</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* ─── Tab: Hierros de Marcación ────────────────── */}
        <Tabs.Panel value="hierros" pt="md">
          <Group mb="md">
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditHierroId(null); setFormHierro({ finca_id: fincaActiva, numero_registro_ica: '', diseno: '', fecha_registro: '', activo: true }); openHierro() }}>
              Registrar Hierro
            </Button>
          </Group>

          <Paper withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Registro ICA</Table.Th>
                  <Table.Th>Diseño</Table.Th>
                  <Table.Th>Fecha Registro</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {hierros.map((h) => (
                  <Table.Tr key={h.id}>
                    <Table.Td fw={500}>{h.numero_registro_ica}</Table.Td>
                    <Table.Td>{h.diseno}</Table.Td>
                    <Table.Td>{h.fecha_registro}</Table.Td>
                    <Table.Td><Badge color={h.activo ? 'green' : 'red'} size="sm">{h.activo ? 'Activo' : 'Inactivo'}</Badge></Table.Td>
                    <Table.Td>
                      <ActionIcon variant="light" color="blue" size="sm" onClick={() => editarHierro(h)}><IconEdit size={14} /></ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {hierros.length === 0 && (
                  <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center" py="sm">No hay hierros registrados</Text></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* ─── Tab: Plantilla ICA ──────────────────────── */}
        <Tabs.Panel value="plantilla" pt="md">
          {plantilla && (
            <Paper p="lg" withBorder>
              <Title order={4}>{plantilla.titulo}</Title>
              <Text size="sm" c="dimmed" mt="xs">{plantilla.resolucion}</Text>
              <Text fw={600} mt="md" mb="sm">Requisitos:</Text>
              <ul>
                {plantilla.requisitos.map((r, i) => (
                  <li key={i}><Text size="sm">{r}</Text></li>
                ))}
              </ul>
            </Paper>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* ─── Modal: Nuevo Traslado ─────────────────────── */}
      <Modal opened={openedTraslado} onClose={() => { closeTraslado(); setFormTraslado({ animal_id: '', destino: '', motivo: '', transportista: '', placa_vehiculo: '', fecha_salida: '' }) }} title="Generar Certificado de Traslado" size="md">
        <Stack>
          <Select
            label="Animal"
            placeholder="Seleccionar animal"
            data={animales.filter(a => a.activo !== false).map(a => ({
              value: a.id.toString(),
              label: `${a.codigo || ''} ${a.nombre || ''} - ${a.especie} (${a.sexo})`.trim(),
            }))}
            value={formTraslado.animal_id}
            onChange={(v) => setFormTraslado({ ...formTraslado, animal_id: v })}
            searchable
            required
          />
          <TextInput label="Destino" value={formTraslado.destino} onChange={(e) => setFormTraslado({ ...formTraslado, destino: e.target.value })} required />
          <TextInput label="Motivo" value={formTraslado.motivo} onChange={(e) => setFormTraslado({ ...formTraslado, motivo: e.target.value })} required />
          <TextInput label="Transportista" value={formTraslado.transportista} onChange={(e) => setFormTraslado({ ...formTraslado, transportista: e.target.value })} required />
          <TextInput label="Placa del Vehículo" value={formTraslado.placa_vehiculo} onChange={(e) => setFormTraslado({ ...formTraslado, placa_vehiculo: e.target.value })} required />
          <TextInput label="Fecha de Salida" type="date" value={formTraslado.fecha_salida} onChange={(e) => setFormTraslado({ ...formTraslado, fecha_salida: e.target.value })} required />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeTraslado}>Cancelar</Button>
            <Button onClick={generarCertificado}>Generar Certificado</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ─── Modal: Registrar/Editar Hierro ────────────── */}
      <Modal opened={openedHierro} onClose={() => { closeHierro(); setEditHierroId(null) }} title={editHierroId ? 'Editar Hierro' : 'Registrar Hierro'} size="md">
        <Stack>
          <Select
            label="Finca"
            data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))}
            value={formHierro.finca_id}
            onChange={(v) => setFormHierro({ ...formHierro, finca_id: v })}
            required
          />
          <TextInput label="Número Registro ICA" value={formHierro.numero_registro_ica} onChange={(e) => setFormHierro({ ...formHierro, numero_registro_ica: e.target.value })} required />
          <Textarea label="Diseño" value={formHierro.diseno} onChange={(e) => setFormHierro({ ...formHierro, diseno: e.target.value })} description="Describa el diseño del hierro (forma, letras, tamaño)" required />
          <TextInput label="Fecha Registro" type="date" value={formHierro.fecha_registro} onChange={(e) => setFormHierro({ ...formHierro, fecha_registro: e.target.value })} required />
          <Select
            label="Estado"
            data={[{ value: 'true', label: 'Activo' }, { value: 'false', label: 'Inactivo' }]}
            value={formHierro.activo.toString()}
            onChange={(v) => setFormHierro({ ...formHierro, activo: v === 'true' })}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { closeHierro(); setEditHierroId(null) }}>Cancelar</Button>
            <Button onClick={registrarHierro}>{editHierroId ? 'Actualizar' : 'Registrar'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
