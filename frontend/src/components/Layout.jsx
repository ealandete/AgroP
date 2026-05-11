import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppShell, Group, Text, NavLink, Burger, Box, Select as MantineSelect,
  useMantineTheme, Avatar, Menu, Badge,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import {
  IconDashboard, IconPig, IconPlant, IconMap, IconCoin,
  IconPackage, IconChartBar, IconLogout, IconUser, IconSettings,
  IconActivity, IconFileDownload, IconEgg, IconBug,
  IconUsers, IconUsersGroup, IconHealthRecognition, IconCalendarEvent, IconClipboardList,
  IconBuildingEstate, IconCheck, IconReportAnalytics, IconFileSpreadsheet,
  IconSearch, IconAlertTriangle, IconMail, IconMedicineSyrup, IconTractor,
  IconShield, IconCertificate, IconDroplet, IconApple,
} from '@tabler/icons-react'
import { useAuth } from '../store/AuthContext.jsx'
import { useModo } from '../store/ModoContext.jsx'
import api from '../services/api.js'
import Breadcrumbs from './Breadcrumbs.jsx'
import ModoSencillo from './ModoSencillo.jsx'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: IconDashboard, to: '/', section: 'core' },
  { label: 'Ganadería', icon: IconPig, to: '/animales', section: 'core' },
  { label: 'Cultivos', icon: IconPlant, to: '/cultivos', section: 'core' },
  { label: 'Lotes y Mapas', icon: IconMap, to: '/lotes', section: 'core' },
  { label: 'Operaciones', icon: IconActivity, to: '/operaciones', section: 'core' },
  { label: 'Grupos Manejo', icon: IconUsersGroup, to: '/grupos-manejo', section: 'core' },
  { label: 'Plantillas', icon: IconFileSpreadsheet, to: '/plantillas', section: 'core' },
  { label: 'Planeación', icon: IconCalendarEvent, to: '/planeacion', section: 'core' },
  { label: 'Equipos/Maquinaria', icon: IconTractor, to: '/equipos', section: 'core' },
  { label: 'Alertas', icon: IconAlertTriangle, to: '/alertas', section: 'core' },
  { label: 'Farmacia', icon: IconMedicineSyrup, to: '/farmacia', section: 'core' },
  { label: 'Agua', icon: IconDroplet, to: '/agua', section: 'core' },
  { label: 'Alimentación', icon: IconApple, to: '/alimentacion', section: 'core' },
  { label: 'Especies', icon: IconPlant, to: '/especies', section: 'especies' },
  { label: 'Consolidado', icon: IconReportAnalytics, to: '/consolidado', section: 'gestion' },
  { label: 'Contabilidad', icon: IconCoin, to: '/contabilidad', section: 'gestion' },
  { label: 'Nómina', icon: IconClipboardList, to: '/nomina', section: 'gestion' },
  { label: 'Inventario', icon: IconPackage, to: '/inventario', section: 'gestion' },
  { label: 'Trabajadores', icon: IconUsers, to: '/trabajadores', section: 'gestion' },
  { label: 'Mensajería', icon: IconMail, to: '/mensajeria', section: 'gestion' },
  { label: 'SST', icon: IconHealthRecognition, to: '/sst', section: 'gestion' },
  { label: 'Bioseguridad', icon: IconShield, to: '/bioseguridad', section: 'gestion' },
  { label: 'Certificaciones', icon: IconCertificate, to: '/certificaciones', section: 'gestion' },
  { label: 'Trazabilidad', icon: IconSearch, to: '/trazabilidad', section: 'gestion' },
  { label: 'Estadísticas', icon: IconChartBar, to: '/estadisticas', section: 'analisis' },
  { label: 'Reportes', icon: IconFileDownload, to: '/exportar', section: 'analisis' },
  { label: 'Admin Sistema', icon: IconSettings, to: '/admin-sistema', section: 'sistema' },
  { label: 'Configuración', icon: IconSettings, to: '/configuracion', section: 'sistema' },
]

const ROLE_NAV_ACCESS = {
  admin: NAV_ITEMS.map(i => i.to),
  veterinario: ['/', '/animales', '/planeacion', '/estadisticas', '/alertas', '/especies'],
  capataz: ['/', '/cultivos', '/lotes', '/operaciones', '/planeacion', '/trabajadores', '/especies'],
  contador: ['/', '/contabilidad', '/inventario', '/nomina', '/estadisticas', '/consolidado'],
  asistente: ['/', '/animales', '/cultivos', '/plantillas', '/exportar'],
}

const ROLES_SELECT = [
  { value: 'admin', label: 'Dueño/Admin' },
  { value: 'veterinario', label: 'Veterinario' },
  { value: 'capataz', label: 'Capataz' },
  { value: 'contador', label: 'Contador' },
  { value: 'asistente', label: 'Asistente' },
]

const ROUTE_NAMES = {
  '/': 'Dashboard',
  '/animales': 'Animales',
  '/cultivos': 'Cultivos',
  '/lotes': 'Lotes y Mapas',
  '/operaciones': 'Operaciones',
  '/planeacion': 'Planeación',
  '/especies': 'Especies',
  '/avicola': 'Avícola',
  '/porcicola': 'Porcícola',
  '/apicultura': 'Apicultura',
  '/equinos': 'Equinos',
  '/caninos-felinos': 'Caninos y Felinos',
  '/pequenos-mamiferos': 'Pequeños Mamíferos',
  '/consolidado': 'Consolidado Contable',
  '/contabilidad': 'Contabilidad',
  '/nomina': 'Nómina',
  '/inventario': 'Inventario',
  '/plantillas': 'Plantillas',
  '/grupos-manejo': 'Grupos Manejo',
  '/trabajadores': 'Trabajadores',
  '/sst': 'SST',
  '/estadisticas': 'Estadísticas',
  '/exportar': 'Reportes',
  '/admin-sistema': 'Admin Sistema',
  '/configuracion': 'Configuración',
  '/finanzas': 'Finanzas',
  '/trazabilidad': 'Trazabilidad',
  '/bioseguridad': 'Bioseguridad',
  '/certificaciones': 'Certificaciones',
  '/ficha-animal': 'Ficha Animal',
  '/cultivos/ficha': 'Ficha Cultivo',
  '/equipos': 'Equipos/Maquinaria',
  '/alertas': 'Alertas',
  '/mensajeria': 'Mensajería',
  '/farmacia': 'Farmacia',
  '/agua': 'Agua',
  '/alimentacion': 'Alimentación',
  '/inicio-propietario': 'Panel Propietario',
  '/inicio-capataz': 'Panel Capataz',
  '/inicio-veterinario': 'Panel Veterinario',
  '/inicio-contador': 'Panel Contador',
  '/inicio-asistente': 'Panel Asistente',
}

export default function Layout() {
  const theme = useMantineTheme()
  const [opened, { toggle }] = useDisclosure()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, role, activeRole, setActiveRole, isAdmin } = useAuth()
  const [fincas, setFincas] = useState([])
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0)
  const [fincaActiva, setFincaActiva] = useState(() => localStorage.getItem('agrop_finca_id') || '')
  const [fincaDetails, setFincaDetails] = useState(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const { modoSencillo, toggleModoSencillo } = useModo()
  const effectiveRole = activeRole || role || 'admin'
  const allowedRoutes = ROLE_NAV_ACCESS[effectiveRole] || ROLE_NAV_ACCESS.admin

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

  useEffect(() => {
    const fetchNoLeidos = () => {
      api.get('/mensajes/no-leidos').then(r => {
        setMensajesNoLeidos(r.data?.total || 0)
      }).catch(() => {})
    }
    fetchNoLeidos()
    const interval = setInterval(fetchNoLeidos, 30000)
    return () => clearInterval(interval)
  }, [])

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

  const filteredNavItems = NAV_ITEMS.filter(item => allowedRoutes.includes(item.to))

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={{ base: 'xs', sm: 'md' }}
    >
      <AppShell.Header>
        <Group h="100%" px={{ base: 'xs', sm: 'md' }} justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <IconPlant size={28} color={theme.colors.green[7]} />
            <Text fw={700} size="lg" c="green.8">AgroP</Text>
            {isMobile ? (
              <MantineSelect
                data={fincas.map(f => ({ value: f.id.toString(), label: f.nombre }))}
                value={fincaActiva}
                onChange={cambiarFinca}
                size="xs"
                w={140}
              />
            ) : (
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
            )}
            {isAdmin && !isMobile && (
              <MantineSelect
                data={ROLES_SELECT}
                value={effectiveRole}
                onChange={(val) => { setActiveRole(val); navigate('/') }}
                size="xs"
                w={150}
                mr="sm"
              />
            )}
          </Group>
          <Menu shadow="md" width={220}>
            <Menu.Target>
              <Group gap="xs" style={{ cursor: 'pointer' }}>
                <Avatar color="green" radius="xl"><IconUser size={20} /></Avatar>
                <Text size="sm" visibleFrom="sm">{user?.nombre || 'Admin'}</Text>
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              {isAdmin && (
                <>
                  <Menu.Label>Vista como</Menu.Label>
                  {ROLES_SELECT.map(r => (
                    <Menu.Item
                      key={r.value}
                      onClick={() => { setActiveRole(r.value); navigate('/') }}
                      leftSection={r.value === effectiveRole ? <IconCheck size={16} /> : null}
                    >
                      {r.label}
                    </Menu.Item>
                  ))}
                  <Menu.Divider />
                </>
              )}
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
              <Menu.Item
                leftSection={modoSencillo ? <IconCheck size={16} /> : <IconSettings size={16} />}
                onClick={toggleModoSencillo}
                c={modoSencillo ? 'green' : undefined}
              >
                {modoSencillo ? '✨ Modo Sencillo' : 'Modo Sencillo'}
              </Menu.Item>
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

      <AppShell.Navbar p={{ base: 'xs', sm: 'sm' }}>
        {(() => {
          const sections = {
            core: { label: 'PRODUCCIÓN', color: 'green' },
            especies: { label: 'ESPECIES', color: 'blue' },
            gestion: { label: 'GESTIÓN', color: 'orange' },
            analisis: { label: 'ANÁLISIS', color: 'grape' },
            sistema: { label: 'SISTEMA', color: 'gray' },
          }
          let currentSection = ''
          return filteredNavItems.flatMap((item) => {
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
            const isMensajeria = item.to === '/mensajeria'
            items.push(
              <NavLink
                key={item.to}
                label={item.label}
                leftSection={<item.icon size={20} stroke={1.5} />}
                rightSection={isMensajeria && mensajesNoLeidos > 0 ? (
                  <Badge size="xs" color="red" variant="filled" circle>{mensajesNoLeidos}</Badge>
                ) : null}
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
        {modoSencillo && (
          <Paper p="xs" mb="sm" bg="green.1" c="green.8" fw={500} style={{ borderRadius: 8 }}>
            ✨ Modo Sencillo activo
          </Paper>
        )}
        <Box hiddenFrom="xs" mb="xs">
          <Breadcrumbs items={getBreadcrumbItems()} />
        </Box>
        <Outlet />
      </AppShell.Main>
      {modoSencillo && <ModoSencillo />}
    </AppShell>
  )
}
