import { Modal, Tabs, Stack, Text, Title, Group, ThemeIcon, Badge, Kbd, List, Anchor, Paper, SimpleGrid } from '@mantine/core'
import {
  IconPig, IconPlant, IconMap, IconCoin, IconUsers,
  IconCalendarEvent, IconAlertTriangle, IconPackage,
  IconActivity, IconFileDownload, IconChartBar,
  IconShield, IconCertificate, IconSearch,
  IconDashboard, IconKeyboard, IconHelp, IconBook,
} from '@tabler/icons-react'

const MODULES = [
  { icon: IconDashboard, label: 'Dashboard', desc: 'Panel principal con indicadores clave de la finca' },
  { icon: IconPig, label: 'Ganadería', desc: 'Gestión de animales: registro, salud, producción, pesajes, reproducción' },
  { icon: IconPlant, label: 'Cultivos', desc: 'Gestión de cultivos: siembras, cosechas, tratamientos, rotación' },
  { icon: IconMap, label: 'Lotes y Mapas', desc: 'Delimitación de lotes en mapa, medición de áreas, planificación' },
  { icon: IconActivity, label: 'Operaciones', desc: 'Registro de actividades diarias y tareas operativas' },
  { icon: IconCalendarEvent, label: 'Planeación', desc: 'Calendario de actividades programadas' },
  { icon: IconAlertTriangle, label: 'Alertas', desc: 'Notificaciones de eventos sanitarios, tareas vencidas' },
  { icon: IconPackage, label: 'Inventario', desc: 'Control de insumos, productos y existencias' },
  { icon: IconCoin, label: 'Contabilidad', desc: 'Contabilidad completa con PUC colombiano, facturas, presupuestos' },
  { icon: IconUsers, label: 'Trabajadores', desc: 'Gestión de empleados, roles y horarios' },
  { icon: IconChartBar, label: 'Estadísticas', desc: 'Reportes gráficos y análisis de datos' },
  { icon: IconFileDownload, label: 'Reportes', desc: 'Exportación de datos a CSV, Excel y PDF' },
  { icon: IconShield, label: 'Bioseguridad', desc: 'Protocolos y registro de medidas sanitarias' },
  { icon: IconCertificate, label: 'Certificaciones', desc: 'Gestión de certificaciones agropecuarias' },
  { icon: IconSearch, label: 'Trazabilidad', desc: 'Seguimiento de productos desde el origen' },
]

const FAQ = [
  { q: '¿Cómo agrego un animal?', a: 'Ve al módulo Ganadería, haz clic en "Nuevo" y completa el formulario con código, especie, sexo y fecha de ingreso.' },
  { q: '¿Cómo exportar mis datos?', a: 'Usa el módulo Reportes o el botón Exportar en cada módulo. Puedes descargar en CSV o Excel.' },
  { q: '¿Cómo cambio de finca?', a: 'Usa el selector de fincas en la barra superior. Puedes cambiar entre tus fincas registradas.' },
  { q: '¿Qué es Modo Sencillo?', a: 'Un modo simplificado con botones de acceso rápido (FAB) para registrar animales, eventos, pesos y más desde cualquier pantalla.' },
  { q: '¿Cómo asigno un grupo de manejo?', a: 'Desde la ficha del animal o usando la acción masiva "Asignar grupo" seleccionando varios animales.' },
  { q: '¿Dónde veo las alertas?', a: 'En el módulo Alertas. También puedes ver eventos pendientes desde la ficha de cada animal.' },
  { q: '¿Cómo registro un peso?', a: 'Desde la ficha del animal sección Pesajes, o usando Modo Sencillo con el botón "Registrar peso".' },
  { q: '¿Puedo usar AgroP sin internet?', a: 'Sí, AgroP funciona offline para consultas. Los cambios se sincronizan cuando tengas conexión.' },
]

const GLOSARIO = [
  { term: 'BPA', desc: 'Buenas Prácticas Agrícolas — conjunto de principios y normas para garantizar la calidad en producción agrícola' },
  { term: 'PUC', desc: 'Plan Único de Cuentas — catálogo de cuentas contables estandarizado en Colombia' },
  { term: 'SMMLV', desc: 'Salario Mínimo Mensual Legal Vigente — monto mínimo que debe recibir un trabajador en Colombia' },
  { term: 'Chapeta', desc: 'Identificador físico del animal, también conocido como arete o caravana' },
  { term: 'Grupo de manejo', desc: 'Agrupación de animales con características similares para facilitar su gestión' },
  { term: 'Raza', desc: 'Clasificación genética que define las características fenotípicas de un animal' },
  { term: 'Lote', desc: 'Porción de terreno delimitada para uso agrícola o pecuario' },
  { term: 'Evento sanitario', desc: 'Cualquier registro relacionado con la salud del animal: vacunas, enfermedades, desparasitaciones' },
  { term: 'Finca', desc: 'Unidad productiva agropecuaria, también llamada predio o hacienda' },
  { term: 'Cosecha', desc: 'Recolección de productos agrícolas en su punto óptimo de maduración' },
  { term: 'Siembra', desc: 'Proceso de plantar semillas en un lote para producción agrícola' },
  { term: 'Producción', desc: 'Cantidad de producto generado: leche, carne, huevos, granos, etc.' },
]

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'Búsqueda global en el sistema' },
  { keys: ['Ctrl', 'N'], desc: 'Crear nuevo registro (según módulo actual)' },
  { keys: ['Ctrl', 'E'], desc: 'Exportar datos del módulo actual' },
  { keys: ['Ctrl', 'H'], desc: 'Abrir / cerrar ayuda contextual' },
  { keys: ['Ctrl', 'M'], desc: 'Alternar Modo Sencillo' },
  { keys: ['Escape'], desc: 'Cerrar modal o panel abierto' },
  { keys: ['F5'], desc: 'Recargar datos del módulo actual' },
]

export default function ManualUsuario({ opened, onClose }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Manual de Usuario" size="xl" fullScreen>
      <Tabs defaultValue="intro" keepMounted={false}>
        <Tabs.List mb="md" style={{ flexWrap: 'wrap' }}>
          <Tabs.Tab value="intro" leftSection={<IconBook size={14} />}>Introducción</Tabs.Tab>
          <Tabs.Tab value="guia" leftSection={<IconDashboard size={14} />}>Guía rápida</Tabs.Tab>
          <Tabs.Tab value="modulos" leftSection={<IconPig size={14} />}>Módulos</Tabs.Tab>
          <Tabs.Tab value="faq" leftSection={<IconHelp size={14} />}>FAQ</Tabs.Tab>
          <Tabs.Tab value="glosario" leftSection={<IconBook size={14} />}>Glosario</Tabs.Tab>
          <Tabs.Tab value="atajos" leftSection={<IconKeyboard size={14} />}>Atajos</Tabs.Tab>
          <Tabs.Tab value="soporte" leftSection={<IconHelp size={14} />}>Soporte</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="intro">
          <Stack gap="md">
            <Title order={4}>¿Qué es AgroP?</Title>
            <Text>
              AgroP es un sistema integral de gestión agropecuaria diseñado para pequeños y medianos productores colombianos.
              Permite administrar animales, cultivos, lotes, contabilidad, inventario y más desde una plataforma web moderna.
            </Text>
            <Title order={5} mt="md">Requisitos del sistema</Title>
            <List>
              <List.Item>Navegador web moderno (Chrome, Firefox, Edge, Safari actualizado)</List.Item>
              <List.Item>Conexión a internet (con soporte offline parcial)</List.Item>
              <List.Item>Resolución de pantalla mínima: 1024x768</List.Item>
              <List.Item>Cuenta de usuario con rol asignado</List.Item>
            </List>
            <Title order={5} mt="md">Roles disponibles</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {[
                { role: 'Dueño/Admin', desc: 'Acceso completo a todos los módulos y configuración' },
                { role: 'Veterinario', desc: 'Enfoque en animales, salud, alertas y planeación' },
                { role: 'Capataz', desc: 'Enfoque en cultivos, lotes, operaciones y trabajadores' },
                { role: 'Contador', desc: 'Enfoque en contabilidad, inventario, nómina y estadísticas' },
                { role: 'Asistente', desc: 'Acceso a animales, cultivos, plantillas y reportes' },
              ].map(r => (
                <Paper key={r.role} p="sm" withBorder>
                  <Text fw={600} size="sm">{r.role}</Text>
                  <Text size="xs" c="dimmed">{r.desc}</Text>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="guia">
          <Stack gap="md">
            <Title order={4}>Primeros pasos</Title>
            <List>
              <List.Item><strong>Inicio de sesión:</strong> Ingresa con tu correo electrónico y contraseña proporcionados por el administrador</List.Item>
              <List.Item><strong>Seleccionar finca:</strong> En la barra superior elige la finca con la que deseas trabajar</List.Item>
              <List.Item><strong>Navegación:</strong> Usa el menú lateral para acceder a los diferentes módulos</List.Item>
              <List.Item><strong>Modo Sencillo:</strong> Actívalo desde el menú de usuario para acceso rápido a funciones comunes</List.Item>
              <List.Item><strong>Agregar datos:</strong> Comienza registrando tus animales y cultivos usando los botones "Nuevo"</List.Item>
            </List>
            <Title order={5} mt="md">Navegación principal</Title>
            <Text size="sm">
              El menú lateral está organizado en secciones: Producción (animales, cultivos, lotes), Especies, Gestión (contabilidad, inventario),
              Análisis (estadísticas, reportes) y Sistema (configuración). Puedes colapsar el menú en pantallas pequeñas.
            </Text>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="modulos">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {MODULES.map(m => (
              <Paper key={m.label} p="sm" withBorder>
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon variant="light" color="green" size="lg" radius="md">
                    <m.icon size={20} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600} size="sm">{m.label}</Text>
                    <Text size="xs" c="dimmed">{m.desc}</Text>
                  </div>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="faq">
          <Stack gap="md">
            {FAQ.map((item, i) => (
              <Paper key={i} p="sm" withBorder>
                <Text fw={600} size="sm">{item.q}</Text>
                <Text size="sm" mt={4} c="dimmed">{item.a}</Text>
              </Paper>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="glosario">
          <Stack gap="sm">
            {GLOSARIO.map(g => (
              <Group key={g.term} gap="sm" wrap="nowrap">
                <Badge size="lg" variant="filled" color="blue" style={{ minWidth: 80 }}>{g.term}</Badge>
                <Text size="sm">{g.desc}</Text>
              </Group>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="atajos">
          <Stack gap="md">
            <Title order={5}>Atajos de teclado</Title>
            <List>
              {SHORTCUTS.map(s => (
                <List.Item key={s.keys.join('+')}>
                  <Group gap={4} display="inline-flex">
                    {s.keys.map(k => <Kbd key={k} size="sm">{k}</Kbd>)}
                  </Group>
                  {' — '}{s.desc}
                </List.Item>
              ))}
            </List>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="soporte">
          <Stack gap="md">
            <Title order={4}>¿Necesitas ayuda?</Title>
            <Text>
              Si tienes preguntas o encuentras algún problema, puedes contactarnos a través de los siguientes canales:
            </Text>
            <List>
              <List.Item><strong>Correo:</strong> soporte@agrop.com</List.Item>
              <List.Item><strong>WhatsApp:</strong> +57 300 000 0000</List.Item>
              <List.Item><strong>Documentación:</strong> <Anchor href="https://agrop.com/docs" target="_blank">agrop.com/docs</Anchor></List.Item>
            </List>
            <Text size="sm" c="dimmed" mt="md">
              Horario de atención: Lunes a viernes de 8:00 AM a 6:00 PM. Sábados de 8:00 AM a 12:00 PM.
            </Text>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
