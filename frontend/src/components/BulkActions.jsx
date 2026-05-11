import { useState } from 'react'
import { Paper, Group, Text, Button, ActionIcon, Checkbox, Modal, Select, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconDownload, IconTrash, IconUsersGroup, IconToggleLeft, IconToggleRight, IconX } from '@tabler/icons-react'
import api from '../services/api'

export function useSelection(items) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [lastClicked, setLastClicked] = useState(null)

  const toggle = (id, shiftKey) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (shiftKey && lastClicked !== null) {
        const ids = items.map(i => i.id)
        const start = ids.indexOf(lastClicked)
        const end = ids.indexOf(id)
        if (start !== -1 && end !== -1) {
          const [from, to] = start < end ? [start, end] : [end, start]
          for (let idx = from; idx <= to; idx++) {
            next.add(ids[idx])
          }
        }
      } else {
        next.has(id) ? next.delete(id) : next.add(id)
      }
      return new Set(next)
    })
    setLastClicked(id)
  }

  const selectAll = () => setSelectedIds(new Set(items.filter(() => true).map(i => i.id)))
  const deselectAll = () => setSelectedIds(new Set())
  const isSelected = (id) => selectedIds.has(id)
  const selectedCount = selectedIds.size
  const allSelected = items.length > 0 && selectedIds.size === items.length

  return {
    selectedIds, setSelectedIds, toggle, selectAll, deselectAll,
    isSelected, selectedCount, allSelected, lastClicked,
  }
}

export function BulkActionsHeader({ selectedIds, setSelectedIds, items, entityType, onAction }) {
  const [confirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false)
  const [grupoModal, { open: openGrupo, close: closeGrupo }] = useDisclosure(false)
  const [estadoModal, { open: openEstado, close: closeEstado }] = useDisclosure(false)
  const [grupos, setGrupos] = useState([])
  const [selectedGrupo, setSelectedGrupo] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [loading, setLoading] = useState(false)

  const count = selectedIds.size
  if (count === 0) return null

  const allSelected = items.length > 0 && count === items.length

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(i => i.id)))
    }
  }

  const exportSelectedCSV = () => {
    const selectedItems = items.filter(i => selectedIds.has(i.id))
    if (selectedItems.length === 0) return

    const displayColumns = entityType === 'animales'
      ? ['codigo', 'nombre', 'especie', 'sexo', 'peso_kg', 'activo']
      : entityType === 'cultivos'
        ? ['nombre', 'tipo', 'estado', 'fecha_siembra', 'area']
        : entityType === 'lotes'
          ? ['nombre', 'area', 'cultivo_actual']
          : entityType === 'insumos'
            ? ['nombre', 'cantidad', 'unidad', 'tipo']
            : Object.keys(selectedItems[0] || {}).slice(0, 6)

    const headers = displayColumns.map(h => `"${h}"`).join(',')
    const rows = selectedItems.map(item =>
      displayColumns.map(col => {
        const val = item[col]
        return val !== undefined && val !== null ? `"${val}"` : '""'
      }).join(',')
    )

    const csv = ['\uFEFF' + headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entityType || 'export'}_${count}_items.csv`
    a.click()
    URL.revokeObjectURL(url)
    notifications.show({ title: 'Exportado', message: `${count} registros exportados`, color: 'green' })
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const ids = Array.from(selectedIds)
      if (entityType === 'animales') {
        await Promise.all(ids.map(id => api.delete(`/animales/${id}`)))
      } else if (entityType === 'cultivos') {
        await Promise.all(ids.map(id => api.delete(`/cultivos/${id}`)))
      } else if (entityType === 'lotes') {
        await Promise.all(ids.map(id => api.delete(`/lotes/${id}`)))
      } else if (entityType === 'insumos') {
        await Promise.all(ids.map(id => api.delete(`/inventario/${id}`)))
      } else {
        await Promise.all(ids.map(id => api.delete(`/${entityType}/${id}`)))
      }
      notifications.show({ title: 'Eliminados', message: `${count} registros eliminados`, color: 'red' })
      setSelectedIds(new Set())
      closeConfirm()
      if (onAction) onAction('delete', ids)
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudieron eliminar algunos registros', color: 'red' })
    }
    setLoading(false)
  }

  const handleAsignarGrupo = async () => {
    if (!selectedGrupo) return
    setLoading(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map(id => api.patch(`/animales/${id}`, { grupo_manejo_id: parseInt(selectedGrupo) })))
      notifications.show({ title: 'Grupo asignado', message: `${count} animales actualizados`, color: 'green' })
      setSelectedIds(new Set())
      closeGrupo()
      if (onAction) onAction('grupo', ids)
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo asignar el grupo', color: 'red' })
    }
    setLoading(false)
  }

  const handleCambiarEstado = async () => {
    if (!selectedEstado) return
    setLoading(true)
    try {
      const ids = Array.from(selectedIds)
      await Promise.all(ids.map(id => api.patch(`/${entityType}/${id}`, { estado: selectedEstado })))
      notifications.show({ title: 'Estado actualizado', message: `${count} registros actualizados`, color: 'green' })
      setSelectedIds(new Set())
      closeEstado()
      if (onAction) onAction('estado', ids)
    } catch {
      notifications.show({ title: 'Error', message: 'No se pudo actualizar el estado', color: 'red' })
    }
    setLoading(false)
  }

  const openGrupoModal = async () => {
    try {
      const { data } = await api.get('/grupos-manejo/')
      setGrupos(Array.isArray(data) ? data : [])
    } catch {
      setGrupos([])
    }
    setSelectedGrupo('')
    openGrupo()
  }

  return (
    <>
      <Paper
        p="xs"
        withBorder
        bg="grape.0"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          borderBottom: '2px solid var(--mantine-color-grape-3)',
        }}
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              color="grape"
              onClick={handleSelectAll}
              leftSection={allSelected ? <IconToggleRight size={14} /> : <IconToggleLeft size={14} />}
            >
              {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </Button>
            <Text size="sm" fw={600}>
              {count} seleccionado{count !== 1 ? 's' : ''}
            </Text>
          </Group>
          <Group gap={4}>
            <Button
              size="xs"
              variant="light"
              color="blue"
              leftSection={<IconDownload size={14} />}
              onClick={exportSelectedCSV}
            >
              Exportar
            </Button>
            {entityType === 'animales' && (
              <Button
                size="xs"
                variant="light"
                color="cyan"
                leftSection={<IconUsersGroup size={14} />}
                onClick={openGrupoModal}
              >
                Asignar grupo
              </Button>
            )}
            {(entityType === 'cultivos' || entityType === 'tareas' || entityType === 'lotes') && (
              <Button
                size="xs"
                variant="light"
                color="yellow"
                onClick={openEstado}
              >
                Cambiar estado
              </Button>
            )}
            <Button
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={openConfirm}
            >
              Eliminar
            </Button>
          </Group>
        </Group>
      </Paper>

      <Modal opened={confirmOpen} onClose={closeConfirm} title="Confirmar eliminación" size="sm">
        <Stack>
          <Text size="sm">¿Estás seguro de eliminar {count} registro{count !== 1 ? 's' : ''}? Esta acción no se puede deshacer.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConfirm}>Cancelar</Button>
            <Button color="red" onClick={handleDelete} loading={loading}>Eliminar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={grupoModal} onClose={closeGrupo} title="Asignar grupo de manejo" size="sm">
        <Stack>
          <Select
            label="Grupo de manejo"
            placeholder="Selecciona un grupo"
            data={grupos.map(g => ({ value: g.id.toString(), label: g.nombre }))}
            value={selectedGrupo}
            onChange={setSelectedGrupo}
            searchable
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeGrupo}>Cancelar</Button>
            <Button color="cyan" onClick={handleAsignarGrupo} loading={loading} disabled={!selectedGrupo}>Asignar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={estadoModal} onClose={closeEstado} title="Cambiar estado" size="sm">
        <Stack>
          <Select
            label="Nuevo estado"
            placeholder="Selecciona un estado"
            data={[
              { value: 'activo', label: 'Activo' },
              { value: 'inactivo', label: 'Inactivo' },
              { value: 'completado', label: 'Completado' },
              { value: 'cancelado', label: 'Cancelado' },
              { value: 'pendiente', label: 'Pendiente' },
            ]}
            value={selectedEstado}
            onChange={setSelectedEstado}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeEstado}>Cancelar</Button>
            <Button color="yellow" onClick={handleCambiarEstado} loading={loading} disabled={!selectedEstado}>Cambiar</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

export function BulkCheckbox({ id, isSelected, toggle }) {
  return (
    <Checkbox
      checked={isSelected(id)}
      onChange={(e) => toggle(id, e.nativeEvent.shiftKey)}
      size="sm"
    />
  )
}
