import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppShell, Group, Text, NavLink, Burger,
  useMantineTheme, Avatar, Menu,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconDashboard, IconPig, IconPlant, IconMap, IconCoin,
  IconPackage, IconChartBar, IconLogout, IconUser, IconSettings,
  IconActivity, IconFileDownload, IconEgg, IconBug,
  IconUsers, IconUsersGroup, IconHealthRecognition, IconCalendarEvent, IconClipboardList,
  IconBuildingEstate, IconCheck, IconReportAnalytics,
} from '@tabler/icons-react'
import { useAuth } from '../store/AuthContext.jsx'
import api from '../services/api.js'
import Breadcrumbs from './Breadcrumbs.jsx'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: IconDashboard, to: '/', section: 'core' },
  { label: 'Ganadería', icon: IconPig, to: '/animales', section: 'core' },
  { label: 'Cultivos', icon: IconPlant, to: '/cultivos', section: 'core' },
  { label: 'Lotes y Mapas', icon: IconMap, to: '/lotes', section: 'core' },
  { label: 'Operaciones', icon: IconActivity, to: '/operaciones', section: 'core' },
  { label: 'Grupos Manejo', icon: IconUsersGroup, to: '/grupos-manejo', section: 'core' },
  { label: 'Planeación', icon: IconCalendarEvent, to: '/planeacion', section: 'core' },
  { label: 'Avicola', icon: IconEgg, to: '/avicola', section: 'especies' },
  { label: 'Porcicola', icon: IconPig, to: '/porcicola', section: 'especies' },
  { label: 'Apicultura', icon: IconBug, to: '/apicultura', section: 'especies' },
  { label: 'Consolidado', icon: IconReportAnalytics, to: '/consolidado', section: 'gestion' },
  { label: 'Contabilidad', icon: IconCoin, to: '/contabilidad', section: 'gestion' },
  { label: 'Nómina', icon: IconClipboardList, to: '/nomina', section: 'gestion' },
  { label: 'Inventario', icon: IconPackage, to: '/inventario', section: 'gestion' },
  { label: 'Trabajadores', icon: IconUsers, to: '/trabajadores', section: 'gestion' },
  { label: 'SST', icon: IconHealthRecognition, to: '/sst', section: 'gestion' },
  { label: 'Estadísticas', icon: IconChartBar, to: '/estadisticas', section: 'analisis' },
  { label: 'Reportes', icon: IconFileDownload, to: '/exportar', section: 'analisis' },
  { label: 'Admin Sistema', icon: IconSettings, to: '/admin-sistema', section: 'sistema' },
  { label: 'Configuración', icon: IconSettings, to: '/configuracion', section: 'sistema' },
]

const ROUTE_NAMES = {
  '/': 'Dashboard',
  '/animales': 'Animales',
  '/cultivos': 'Cultivos',
  '/lotes': 'Lotes y Mapas',
  '/operaciones': 'Operaciones',
  '/planeacion': 'Planeación',
  '/avicola': 'Avícola',
  '/porcicola': 'Porcícola',
  '/apicultura': 'Apicultura',
  '/consolidado': 'Consolidado Contable',
  '/contabilidad': 'Contabilidad',
  '/nomina': 'Nómina',
  '/inventario': 'Inventario',
  '/grupos-manejo': 'Grupos Manejo',
  '/trabajadores': 'Trabajadores',
  '/sst': 'SST',
  '/estadisticas': 'Estadísticas',
  '/exportar': 'Reportes',
  '/admin-sistema': 'Admin Sistema',
  '/configuracion': 'Configuración',
  '/finanzas': 'Finanzas',
  '/ficha-animal': 'Ficha Animal',
  '/cultivos/ficha': 'Ficha Cultivo',
}

export default function Layout() {
  const theme = useMantineTheme()
  const [opened, { toggle }] = useDisclosure()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [fincas, setFincas] = useState([])
  const [fincaActiva, setFincaActiva] = useState(() => localStorage.getItem('agrop_finca_id') || '')
  const [fincaDetails, setFincaDetails] = useState(null)

  useEffect(() => {
    api.get('/lotes/fincas/').then(r => {
      const d = Array.isArray(r.data) ? r.data : []
      setFincas(d)
      if (!localStorage.getItem('agrop_finca_id') && d.length > 0) {
        setFincaActiva(d[0].id.toString())
        localStorage.setItem('agrop_finca_id', d[0].id.toString())
      }
    }).catch(() => setFincas([]))
  }, [])

  useEffect(() => {
    if (fincaActiva) {
      api.get(`/lotes/fincas/${fincaActiva}/`)
        .then(r => setFincaDetails(r.data))
        .catch(() => setFincaDetails(null))
    }
  }, [fincaActiva])

  const cambiarFinca = (id) => {
    setFincaActiva(id)
    localStorage.setItem('agrop_finca_id', id || '')
    window.location.reload()
  }

  const getBreadcrumbItems = () => {
    const path = location.pathname
    if (path === '/') return []

    const segments = path.split('/').filter(Boolean)
    const items = []
    let accumulated = ''
    for (const segment of segments) {
      accumulated += '/' + segment
      const name = ROUTE_NAMES[accumulated]
      if (name) {
        items.push({ label: name, href: accumulated })
      }
    }
    return items
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <IconPlant size={28} color={theme.colors.green[7]} />
            <Text fw={700} size="lg" c="green.8">AgroP</Text>
            <Menu shadow="md" width={220}>
              <Menu.Target>
                <Group gap={4} style={{ cursor: 'pointer' }}>
                  <IconBuildingEstate size={18} color={theme.colors.green[6]} />
                  <Text size="sm" fw={500}>{fincaDetails?.nombre || fincas.find(f => f.id.toString() === fincaActiva)?.nombre || 'Finca'}</Text>
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                {fincas.map(f => (
                  <Menu.Item
                    key={f.id}
                    onClick={() => cambiarFinca(f.id.toString())}
                    leftSection={f.id.toString() === fincaActiva ? <IconCheck size={16} /> : null}
                  >
                    {f.nombre}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Group>
          <Menu shadow="md" width={220}>
            <Menu.Target>
              <Group gap="xs" style={{ cursor: 'pointer' }}>
                <Avatar color="green" radius="xl"><IconUser size={20} /></Avatar>
                <Text size="sm" visibleFrom="sm">{user?.nombre || 'Admin'}</Text>
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              {fincas.length > 1 && (
                <>
                  <Menu.Label>Fincas</Menu.Label>
                  {fincas.map(f => (
                    <Menu.Item
                      key={f.id}
                      onClick={() => cambiarFinca(f.id.toString())}
                      leftSection={<IconBuildingEstate size={16} />}
                      rightSection={f.id.toString() === fincaActiva ? <IconCheck size={16} /> : null}
                    >
                      {f.nombre}
                    </Menu.Item>
                  ))}
                  <Menu.Divider />
                </>
              )}
              <Menu.Item leftSection={<IconSettings size={16} />} onClick={() => navigate('/configuracion')}>
                Configuración
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={logout}>
                Cerrar Sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {(() => {
          const sections = {
            core: { label: 'PRODUCCIÓN', color: 'green' },
            especies: { label: 'ESPECIES', color: 'blue' },
            gestion: { label: 'GESTIÓN', color: 'orange' },
            analisis: { label: 'ANÁLISIS', color: 'grape' },
            sistema: { label: 'SISTEMA', color: 'gray' },
          }
          let currentSection = ''
          return NAV_ITEMS.flatMap((item) => {
            const items = []
            if (item.section !== currentSection) {
              currentSection = item.section
              const sec = sections[item.section] || { label: item.section.toUpperCase(), color: 'gray' }
              items.push(
                <Text key={`sec-${item.section}`} size="xs" fw={700} c={`${sec.color}.7`} tt="uppercase" px="sm" pt="sm" pb={4}>
                  {sec.label}
                </Text>
              )
            }
            items.push(
              <NavLink
                key={item.to}
                label={item.label}
                leftSection={<item.icon size={20} stroke={1.5} />}
                active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))}
                onClick={() => { navigate(item.to); toggle() }}
                variant="filled"
                mb={4}
                style={{ borderRadius: theme.radius.md }}
              />
            )
            return items
          })
        })()}
      </AppShell.Navbar>

      <AppShell.Main>
        <Breadcrumbs items={getBreadcrumbItems()} />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
