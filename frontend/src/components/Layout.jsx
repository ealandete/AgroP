import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppShell, Group, Text, NavLink, Burger, Box, Select as MantineSelect,
  useMantineTheme, Avatar, Menu, Badge, ActionIcon, Paper,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useMobile } from '../hooks/useMobile.js'
import {
  IconDashboard, IconPig, IconPlant, IconMap, IconCoin,
  IconPackage, IconChartBar, IconLogout, IconUser, IconSettings,
  IconActivity, IconFileDownload, IconEgg, IconBug,
  IconUsers, IconUsersGroup, IconHealthRecognition, IconCalendarEvent, IconClipboardList,
  IconBuildingEstate, IconCheck, IconReportAnalytics, IconFileSpreadsheet,
  IconSearch, IconAlertTriangle, IconMail, IconMedicineSyrup, IconTractor,
  IconShield, IconShieldCheck, IconCertificate, IconDroplet, IconApple, IconQrcode, IconFish,
  IconStethoscope, IconBulldozer, IconDeviceSdCard, IconTree,
  IconBulb, IconPalette, IconDatabase,
} from '@tabler/icons-react'
import { useAuth } from '../store/AuthContext.jsx'
import { useModo } from '../store/ModoContext.jsx'
import { useTema } from '../store/TemaContext.jsx'
import { useIdioma } from '../store/IdiomaContext.jsx'
import { API_URL } from '../config.js'
import api from '../services/api.js'
import Breadcrumbs from './Breadcrumbs.jsx'
import ModoSencillo from './ModoSencillo.jsx'
import QRScanner from './QRScanner.jsx'
import WeatherWidget from './WeatherWidget.jsx'
import HelpButton from './HelpButton.jsx'
import AIAssistant from './AIAssistant.jsx'
import Tour from './Tour.jsx'

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
  { label: 'Picicultura', icon: IconFish, to: '/picicultura', section: 'core' },
  { label: 'Suelos/Análisis', icon: IconBulldozer, to: '/suelos', section: 'core' },
  { label: 'Sensores', icon: IconDeviceSdCard, to: '/sensores', section: 'core' },
  { label: 'Forestal', icon: IconTree, to: '/forestal', section: 'core' },
  { label: 'Especies', icon: IconPlant, to: '/especies', section: 'especies' },
  { label: 'Consolidado', icon: IconReportAnalytics, to: '/consolidado', section: 'gestion' },
  { label: 'Contabilidad', icon: IconCoin, to: '/contabilidad', section: 'gestion' },
  { label: 'Nómina', icon: IconClipboardList, to: '/nomina', section: 'gestion' },
  { label: 'Inventario', icon: IconPackage, to: '/inventario', section: 'gestion' },
  { label: 'Trabajadores', icon: IconUsers, to: '/trabajadores', section: 'gestion' },
  { label: 'Mensajería', icon: IconMail, to: '/mensajeria', section: 'gestion' },
  { label: 'SST', icon: IconHealthRecognition, to: '/sst', section: 'gestion' },
  { label: 'Bioseguridad', icon: IconShield, to: '/bioseguridad', section: 'gestion' },
  { label: 'Procedimientos Vet', icon: IconStethoscope, to: '/procedimientos-veterinarios', section: 'gestion' },
  { label: 'Certificaciones', icon: IconCertificate, to: '/certificaciones', section: 'gestion' },
  { label: 'Trazabilidad', icon: IconSearch, to: '/trazabilidad', section: 'gestion' },
  { label: 'Estadísticas', icon: IconChartBar, to: '/estadisticas', section: 'analisis' },
  { label: 'Recomendaciones', icon: IconBulb, to: '/recomendaciones', section: 'analisis' },
  { label: 'Reportes', icon: IconFileDownload, to: '/exportar', section: 'analisis' },
  { label: 'Cumplimiento', icon: IconShieldCheck, to: '/cumplimiento', section: 'sistema' },
  { label: 'Respaldos', icon: IconDatabase, to: '/backup', section: 'sistema' },
  { label: 'Admin Sistema', icon: IconSettings, to: '/admin-sistema', section: 'sistema' },
  { label: 'Configuración', icon: IconSettings, to: '/configuracion', section: 'sistema' },
  { label: 'Personalizar', icon: IconPalette, to: '/personalizacion', section: 'sistema' },
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
  '/picicultura': 'Picicultura',
  '/procedimientos-veterinarios': 'Procedimientos Veterinarios',
  '/inicio-propietario': 'Panel Propietario',
  '/inicio-capataz': 'Panel Capataz',
  '/inicio-veterinario': 'Panel Veterinario',
  '/inicio-contador': 'Panel Contador',
  '/inicio-asistente': 'Panel Asistente',
  '/suelos': 'Suelos/Análisis',
  '/sensores': 'Sensores',
  '/forestal': 'Forestal',
  '/recomendaciones': 'Recomendaciones',
  '/cumplimiento': 'Cumplimiento Normativo',
  '/personalizacion': 'Personalización',
}

export default function Layout() {
  const theme = useMantineTheme()
  const [opened, { toggle }] = useDisclosure()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, role, activeRole, setActiveRole, isAdmin } = useAuth()
  const { t, idioma, setIdioma, IDIOMAS } = useIdioma()
  const [fincas, setFincas] = useState([])
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0)
  const [fincaActiva, setFincaActiva] = useState(() => localStorage.getItem('agrop_finca_id') || '')
  const [fincaDetails, setFincaDetails] = useState(null)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isMobileHook = useMobile()

  const [qrScannerOpened, setQrScannerOpened] = useState(false)
  const { modoSencillo, toggleModoSencillo } = useModo()
  const touchStartX = useRef(0)
  const { tema } = useTema()
  const [logoSrc, setLogoSrc] = useState(null)

  const logoId = fincaActiva || 'global'
  const loadLogo = () => {
    setLogoSrc(`${API_URL}/logo/${logoId}?t=${Date.now()}`)
  }

  useEffect(() => { loadLogo() }, [logoId])

  useEffect(() => {
    const handler = () => loadLogo()
    window.addEventListener('logo-updated', handler)
    return () => window.removeEventListener('logo-updated', handler)
  }, [logoId])

  useEffect(() => {
    if (!isMobileHook) return
    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
    const handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current
      if (dx > 80 && location.pathname !== '/') {
        navigate(-1)
      }
    }
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobileHook, location.pathname, navigate])
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
            <Box
              component="a"
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/personalizacion') }}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{ height: 28, width: 'auto', maxWidth: 120 }}
                  onError={() => setLogoSrc(null)}
                />
              ) : (
                <IconPlant size={28} color={theme.colors.green[7]} />
              )}
              <Text fw={700} size="lg" c="green.8">AgroP</Text>
            </Box>
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
          <Group gap={4}>
            <ActionIcon variant="subtle" color="green" size="lg" onClick={() => setQrScannerOpened(true)}>
              <IconQrcode size={22} />
            </ActionIcon>
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
                {modoSencillo ? `✨ ${t('modo_sencillo')}` : t('modo_sencillo')}
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings size={16} />} onClick={() => navigate('/configuracion')}>
                {t('configuracion')}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>{t('cambiar_idioma')} - {idioma === 'es' ? '🌐' : '🌐'}</Menu.Label>
              {Object.entries(IDIOMAS).map(([key, lang]) => (
                <Menu.Item
                  key={key}
                  onClick={() => setIdioma(key)}
                  leftSection={<Text>{lang.bandera}</Text>}
                  rightSection={idioma === key ? <IconCheck size={16} /> : null}
                >
                  {lang.nombre}
                </Menu.Item>
              ))}
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={logout}>
                {t('cerrar_sesion')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={{ base: 'xs', sm: 'sm' }}>
          {(() => {
          const sections = {
            core: { label: t('sec_produccion'), color: 'green' },
            especies: { label: t('sec_especies'), color: 'blue' },
            gestion: { label: t('sec_gestion'), color: 'orange' },
            analisis: { label: t('sec_analisis'), color: 'grape' },
            sistema: { label: t('sec_sistema'), color: 'gray' },
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
        <Box mt="auto" px="sm" pt="sm">
          <WeatherWidget compact />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        {modoSencillo && (
          <Paper p="xs" mb="sm" bg="green.1" c="green.8" fw={500} style={{ borderRadius: 8 }}>
            {t('modo_sencillo_activo')}
          </Paper>
        )}
        <Box hiddenFrom="xs" mb="xs">
          <Breadcrumbs items={getBreadcrumbItems()} />
        </Box>
        <Box pb={isMobileHook ? 70 : 0}>
          <Outlet />
        </Box>
      </AppShell.Main>

      {isMobileHook && (
        <Paper
          withBorder
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
            backgroundColor: 'white',
          }}
          radius={0}
        >
          <Group justify="space-around" gap={0} py={4}>
            {[
              { icon: IconDashboard, label: t('inicio'), to: '/' },
              { icon: IconPig, label: t('animales'), to: '/animales' },
              { icon: IconPlant, label: t('nav_cultivos'), to: '/cultivos' },
              { icon: IconMap, label: t('lotes_mobile'), to: '/lotes' },
              { icon: IconStethoscope, label: t('vet'), to: '/procedimientos-veterinarios' },
            ].map(item => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
              return (
                <Box
                  key={item.to}
                  onClick={() => { navigate(item.to); if (opened) toggle() }}
                  style={{
                    cursor: 'pointer', textAlign: 'center', padding: '4px 8px',
                    minWidth: 56, minHeight: 44, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', borderRadius: 8,
                    backgroundColor: active ? 'var(--mantine-color-green-0)' : 'transparent',
                  }}
                >
                  <item.icon size={22} color={active ? 'var(--mantine-color-green-7)' : 'var(--mantine-color-gray-6)'} stroke={active ? 2 : 1.5} />
                  <Text size="10px" fw={active ? 600 : 400} c={active ? 'green.7' : 'dimmed'}>{item.label}</Text>
                </Box>
              )
            })}
          </Group>
        </Paper>
      )}

      {modoSencillo && <ModoSencillo />}
      <QRScanner opened={qrScannerOpened} onClose={() => setQrScannerOpened(false)} />
      <HelpButton />
      <AIAssistant />
      <Tour />
    </AppShell>
  )
}
