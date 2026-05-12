import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paper, Title, Group, Text, Stack, SimpleGrid, Badge } from '@mantine/core'
import {
  IconEgg, IconPig, IconBug, IconDog, IconCat, IconPaw, IconPlant,
} from '@tabler/icons-react'
import api from '../services/api.js'

const MODULES = [
  {
    key: 'avicola', label: 'Avícola', icon: IconEgg, color: 'yellow',
    path: '/avicola', especie: 'aviar', desc: 'Pollos, gallinas, patos',
  },
  {
    key: 'porcicola', label: 'Porcícola', icon: IconPig, color: 'pink',
    path: '/porcicola', especie: 'porcino', desc: 'Cerdos, lechones',
  },
  {
    key: 'apicultura', label: 'Apicultura', icon: IconBug, color: 'orange',
    path: '/apicultura', especie: null, desc: 'Abejas, colmenas, miel',
  },
  {
    key: 'mascotas', label: 'Mascotas', icon: IconDog, color: 'grape',
    path: '/mascotas', especie: null, desc: 'Perros y gatos',
  },
  {
    key: 'pequenos', label: 'Pequeños Mamíferos', icon: IconPaw, color: 'teal',
    path: '/pequenos-mamiferos', especie: 'conejo', desc: 'Conejos, chigüiros, cuyes',
  },
]

const CATEGORIES = [
  { label: 'AVES', color: 'yellow', keys: ['avicola'] },
  { label: 'PORCINOS', color: 'pink', keys: ['porcicola'] },
  { label: 'MASCOTAS', color: 'grape', keys: ['mascotas'] },
  { label: 'PEQUEÑOS MAMÍFEROS', color: 'teal', keys: ['pequenos'] },
  { label: 'APICULTURA', color: 'orange', keys: ['apicultura'] },
]

export default function EspeciesMenu() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({})

  useEffect(() => {
    api.get('/animales/stats/resumen').then(r => {
      const m = {}
      for (const s of r.data) {
        m[s.especie] = s
      }
      setStats(m)
    }).catch(() => {})
  }, [])

  const getTotal = (mod) => {
    if (mod.key === 'apicultura') return ''
    if (mod.key === 'avicola') {
      const total = Object.values(stats).reduce((s, st) => s + (st.especie === 'aviar' ? st.total : 0), 0)
      return total || ''
    }
    if (mod.key === 'mascotas') {
      const caninos = Object.values(stats).reduce((s, st) => s + (st.especie === 'canino' ? st.total : 0), 0)
      const felinos = Object.values(stats).reduce((s, st) => s + (st.especie === 'felino' ? st.total : 0), 0)
      return (caninos + felinos) || ''
    }
    if (mod.key === 'pequenos') {
      const total = ['conejo', 'chiguiro', 'cuy'].reduce((s, esp) =>
        s + (Object.values(stats).reduce((s2, st) => s2 + (st.especie === esp ? st.total : 0), 0)), 0)
      return total || ''
    }
    const s = stats[mod.especie]
    return s ? s.total : ''
  }

  const getActivos = (mod) => {
    if (mod.key === 'apicultura') return ''
    if (mod.key === 'avicola') {
      const total = Object.values(stats).reduce((s, st) => s + (st.especie === 'aviar' ? st.activos : 0), 0)
      return total || ''
    }
    if (mod.key === 'mascotas') {
      const caninos = Object.values(stats).reduce((s, st) => s + (st.especie === 'canino' ? st.activos : 0), 0)
      const felinos = Object.values(stats).reduce((s, st) => s + (st.especie === 'felino' ? st.activos : 0), 0)
      return (caninos + felinos) || ''
    }
    if (mod.key === 'pequenos') {
      const total = ['conejo', 'chiguiro', 'cuy'].reduce((s, esp) =>
        s + (Object.values(stats).reduce((s2, st) => s2 + (st.especie === esp ? st.activos : 0), 0)), 0)
      return total || ''
    }
    const s = stats[mod.especie]
    return s ? s.activos : ''
  }

  return (
    <Stack>
      <Title order={3}>Gestión por Especies</Title>
      <Text c="dimmed" size="sm">Seleccione un módulo para gestionar cada especie</Text>

      {CATEGORIES.map(cat => (
        <Paper key={cat.label} p="md" radius="md" withBorder>
          <Text size="xs" fw={700} c={`${cat.color}.7`} tt="uppercase" mb="sm">{cat.label}</Text>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {MODULES.filter(m => cat.keys.includes(m.key)).map(mod => {
              const Icon = mod.icon
              const total = getTotal(mod)
              const activos = getActivos(mod)
              return (
                <Paper
                  key={mod.key}
                  p="lg"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(mod.path)}
                >
                  <Group>
                    <Icon size={36} color={`var(--mantine-color-${mod.color}-6)`} />
                    <div>
                      <Text fw={600} size="md">{mod.label}</Text>
                      <Text size="xs" c="dimmed">{mod.desc}</Text>
                    </div>
                  </Group>
                  {total !== '' && (
                    <Group mt="sm" gap="xs">
                      <Badge size="lg" variant="light" color={mod.color}>{total} total</Badge>
                      <Badge size="lg" variant="light" color="green">{activos} activos</Badge>
                    </Group>
                  )}
                  {mod.key === 'apicultura' && (
                    <Badge size="lg" variant="light" color="orange" mt="sm">Gestión de colmenas</Badge>
                  )}
                </Paper>
              )
            })}
          </SimpleGrid>
        </Paper>
      ))}
    </Stack>
  )
}
