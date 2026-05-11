import { useEffect, useState } from 'react'
import {
  Paper, Title, Group, Button, Stack, SimpleGrid, Text, Badge,
} from '@mantine/core'
import {
  IconPig, IconPlant, IconCoin, IconCash, IconMilk,
  IconWeight, IconStethoscope, IconMap, IconHeart,
  IconBread, IconArrowsExchange, IconTools, IconBox,
  IconFileTypeCsv, IconFileSpreadsheet, IconFileTypePdf,
} from '@tabler/icons-react'
import api from '../services/api.js'
import { formatNumber } from '../config.js'

const MODELOS = [
  { key: 'animales', label: 'Animales', icon: IconPig, color: 'green' },
  { key: 'siembras', label: 'Siembras', icon: IconPlant, color: 'teal' },
  { key: 'ventas', label: 'Ventas', icon: IconCash, color: 'blue' },
  { key: 'costos', label: 'Costos', icon: IconCoin, color: 'orange' },
  { key: 'ordenos', label: 'Ordeños', icon: IconMilk, color: 'cyan' },
  { key: 'pesajes', label: 'Pesajes', icon: IconWeight, color: 'grape' },
  { key: 'sanidad', label: 'Sanidad', icon: IconStethoscope, color: 'red' },
  { key: 'lotes', label: 'Lotes', icon: IconMap, color: 'lime' },
  { key: 'reproduccion', label: 'Reproducción', icon: IconHeart, color: 'pink' },
  { key: 'lactancias', label: 'Lactancias', icon: IconMilk, color: 'indigo' },
  { key: 'alimentacion', label: 'Alimentación', icon: IconBread, color: 'yellow' },
  { key: 'movimientos', label: 'Movimientos', icon: IconArrowsExchange, color: 'violet' },
  { key: 'labores', label: 'Labores', icon: IconTools, color: 'brown' },
  { key: 'productos', label: 'Productos', icon: IconBox, color: 'dark' },
]

export default function Exportar() {
  const [counts, setCounts] = useState({})

  useEffect(() => {
    MODELOS.forEach(({ key }) => {
      api.get(`/${key}/`).then(r => {
        setCounts(c => ({ ...c, [key]: Array.isArray(r.data) ? r.data.length : 0 }))
      }).catch(() => {
        setCounts(c => ({ ...c, [key]: 0 }))
      })
    })
  }, [])

  return (
    <Stack>
      <Title order={3}>Centro de Exportación</Title>
      <Text c="dimmed">Seleccione el modelo y formato para exportar datos.</Text>

      <SimpleGrid cols={3}>
        {MODELOS.map((m) => (
          <Paper key={m.key} withBorder p="md">
            <Group mb="xs">
              <m.icon size={28} color={`var(--mantine-color-${m.color}-7)`} />
              <div>
                <Text fw={600}>{m.label}</Text>
                <Badge size="sm" variant="light" color={m.color}>
                  {counts[m.key] != null ? formatNumber(counts[m.key]) : '...'} registros
                </Badge>
              </div>
            </Group>
            <Group gap={8} mt="md">
              <Button
                component="a"
                href={`/api/export/csv/${m.key}`}
                download
                size="xs"
                variant="light"
                color="green"
                leftSection={<IconFileTypeCsv size={14} />}
              >
                CSV
              </Button>
              <Button
                component="a"
                href={`/api/export/excel/${m.key}`}
                download
                size="xs"
                variant="light"
                color="blue"
                leftSection={<IconFileSpreadsheet size={14} />}
              >
                Excel
              </Button>
              <Button
                component="a"
                href={`/api/export/pdf/${m.key}`}
                download
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconFileTypePdf size={14} />}
              >
                PDF
              </Button>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      <Title order={4} mt="lg">Reportes Financieros</Title>
      <SimpleGrid cols={2}>
        <Paper withBorder p="lg">
          <Group mb="md">
            <IconCoin size={32} color={`var(--mantine-color-green-7)`} />
            <div>
              <Text fw={600}>Reporte de Animales</Text>
              <Text size="sm" c="dimmed">Resumen de inventario animal, razas, estado y valoración</Text>
            </div>
          </Group>
          <Button
            component="a"
            href="/api/export/pdf/reporte-animales"
            download
            variant="filled"
            color="green"
            leftSection={<IconFileTypePdf size={16} />}
            fullWidth
          >
            Descargar PDF
          </Button>
        </Paper>
        <Paper withBorder p="lg">
          <Group mb="md">
            <IconCash size={32} color={`var(--mantine-color-blue-7)`} />
            <div>
              <Text fw={600}>Reporte Financiero</Text>
              <Text size="sm" c="dimmed">Resumen de ingresos, costos y rentabilidad</Text>
            </div>
          </Group>
          <Button
            component="a"
            href="/api/export/pdf/reporte-financiero"
            download
            variant="filled"
            color="blue"
            leftSection={<IconFileTypePdf size={16} />}
            fullWidth
          >
            Descargar PDF
          </Button>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}
