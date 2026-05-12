import { Modal, Tabs, Stack, Text, Title, Group, ThemeIcon, Badge, Kbd, List, Anchor, Paper, SimpleGrid, TextInput } from '@mantine/core'
import { useState, useMemo } from 'react'
import {
  IconPig, IconPlant, IconMap, IconCoin, IconUsers,
  IconCalendarEvent, IconAlertTriangle, IconPackage,
  IconActivity, IconFileDownload, IconChartBar,
  IconShield, IconCertificate, IconSearch,
  IconDashboard, IconKeyboard, IconHelp, IconBook,
  IconUsersGroup, IconFileSpreadsheet, IconTractor,
  IconMedicineSyrup, IconDroplet, IconApple, IconFish,
  IconBulldozer, IconDeviceSdCard, IconTree, IconMail,
  IconHealthRecognition, IconStethoscope, IconSettings,
  IconReportAnalytics, IconClipboardList, IconBulb,
  IconShieldCheck, IconPaw,
} from '@tabler/icons-react'

const MODULES = [
  { icon: IconDashboard, label: 'Dashboard', desc: 'Panel principal con indicadores clave de la finca: total animales, cultivos activos, alertas, ingresos y gastos del mes.' },
  { icon: IconPig, label: 'Ganadería (Bovinos)', desc: 'Gestión completa de bovinos: registro individual, chapeta, raza, grupo de manejo, eventos sanitarios, pesajes, reproducción, producción de leche.' },
  { icon: IconPlant, label: 'Cultivos', desc: 'Administración de cultivos: siembras, cosechas, tratamientos, fertilización, costos de producción, rotación de cultivos por lote.' },
  { icon: IconMap, label: 'Lotes y Mapas', desc: 'Delimitación de lotes en mapa interactivo, medición de áreas con polígonos, planificación de uso del suelo, rotación de cultivos.' },
  { icon: IconUsersGroup, label: 'Grupos de Manejo', desc: 'Agrupación de animales por etapa productiva: destetos, levante, ceba, vientres, toros. Gestión masiva y filtros por grupo.' },
  { icon: IconActivity, label: 'Operaciones', desc: 'Registro de actividades diarias: labores culturales, mantenimiento, riego, aplicación de insumos. Asignación de tareas a trabajadores.' },
  { icon: IconCalendarEvent, label: 'Planeación', desc: 'Calendario de actividades programadas: vacunaciones, desparasitaciones, cosechas, inseminaciones. Recordatorios y alertas automáticas.' },
  { icon: IconAlertTriangle, label: 'Alertas', desc: 'Notificaciones de eventos sanitarios, tareas vencidas, cumpleaños de animales, vencimientos de medicamentos y certificaciones.' },
  { icon: IconFileSpreadsheet, label: 'Plantillas', desc: 'Creación y gestión de plantillas para eventos, pesajes, operaciones y documentos. Ahorra tiempo en registros repetitivos.' },
  { icon: IconTractor, label: 'Equipos y Maquinaria', desc: 'Control de maquinaria agrícola: ficha técnica, mantenimiento preventivo, combustible, horas de uso, asignación a operarios.' },
  { icon: IconMedicineSyrup, label: 'Farmacia', desc: 'Inventario de medicamentos veterinarios: lotes, fechas de vencimiento, dosificación, aplicaciones por animal, alertas de vencimiento.' },
  { icon: IconDroplet, label: 'Agua', desc: 'Gestión del recurso hídrico: fuentes de agua, consumo, calidad, infraestructura de riego, programación de riego por cultivo.' },
  { icon: IconApple, label: 'Alimentación', desc: 'Raciones por tipo de animal y etapa productiva, suplementos, pastos, concentrados, programación de comidas y costos de alimentación.' },
  { icon: IconFish, label: 'Picicultura', desc: 'Gestión de peces: estanques, siembra de alevinos, cosecha, alimentación, parámetros de calidad de agua (pH, oxígeno, temperatura).' },
  { icon: IconBulldozer, label: 'Suelos y Análisis', desc: 'Análisis de suelos: muestreo por lote, resultados de laboratorio, fertilidad, pH, materia orgánica, plan de fertilización personalizado.' },
  { icon: IconDeviceSdCard, label: 'Sensores IoT', desc: 'Integración con sensores: temperatura, humedad, lluvia, peso automático. Monitoreo en tiempo real y alertas por umbrales.' },
  { icon: IconTree, label: 'Forestal', desc: 'Plantaciones forestales: especies, parcelas, crecimiento, podas, raleos, aprovechamiento, permisos y certificaciones forestales.' },
  { icon: IconPaw, label: 'Especies Menores', desc: 'Gestión de porcinos, aves, equinos, ovinos, caprinos, caninos y felinos. Parámetros específicos por especie.' },
  { icon: IconCoin, label: 'Contabilidad', desc: 'Contabilidad completa con PUC colombiano integrado: facturación, costos, presupuestos, libro contable, ingresos vs gastos, balance general.' },
  { icon: IconClipboardList, label: 'Nómina', desc: 'Liquidación de nómina: salarios, prestaciones sociales, seguridad social, provisiones, comprobantes de pago, reportes a entidades.' },
  { icon: IconPackage, label: 'Inventario', desc: 'Control de insumos, productos agrícolas, concentrados, herramientas: entradas, salidas, stock mínimo, inventarios físicos, alertas de reorden.' },
  { icon: IconUsers, label: 'Trabajadores', desc: 'Registro de empleados, roles, horarios, asistencia, contratos, afiliaciones a seguridad social, liquidación de prestaciones.' },
  { icon: IconMail, label: 'Mensajería', desc: 'Mensajería interna entre usuarios de la finca: notificaciones, compartición de archivos, registro de comunicación para auditoría.' },
  { icon: IconHealthRecognition, label: 'SST', desc: 'Seguridad y Salud en el Trabajo: matriz de peligros, ARL, capacitaciones, incidentes, accidentes, EPI, reportes a Ministerio.' },
  { icon: IconShield, label: 'Bioseguridad', desc: 'Protocolos sanitarios: ingreso a finca, desinfección, cuarentenas, control de plagas, registro de medidas, certificaciones BPA.' },
  { icon: IconStethoscope, label: 'Procedimientos Veterinarios', desc: 'Protocolos veterinarios: cirugías, tratamientos, diagnósticos, recetas médicas, seguimiento de casos clínicos, historial por animal.' },
  { icon: IconCertificate, label: 'Certificaciones', desc: 'Gestión de certificaciones: BPA, orgánico, comercio justo, Global GAP, ICA. Documentación, auditorías, alertas de vencimiento.' },
  { icon: IconSearch, label: 'Trazabilidad', desc: 'Seguimiento de productos desde el origen: códigos QR, blockchain, historial completo, integración con sistemas ICA.' },
  { icon: IconChartBar, label: 'Estadísticas', desc: 'Reportes gráficos: producción, crecimiento, finanzas, comparativas, tendencias. Exportación de gráficos como imagen.' },
  { icon: IconBulb, label: 'Recomendaciones', desc: 'Recomendaciones inteligentes basadas en datos: sanidad, nutrición, manejo, mejora genética, alertas tempranas de problemas.' },
  { icon: IconFileDownload, label: 'Reportes', desc: 'Exportación de datos a CSV, Excel y PDF. Reportes personalizados por módulo, periodo y formato con gráficos incluidos.' },
  { icon: IconShieldCheck, label: 'Cumplimiento', desc: 'Indicadores de cumplimiento de metas: productivas, financieras, sanitarias. Seguimiento de objetivos con alertas de desviación.' },
  { icon: IconReportAnalytics, label: 'Consolidado Contable', desc: 'Visión consolidada de contabilidad, nómina, inventario y finanzas. Reporte unificado con indicadores financieros clave.' },
  { icon: IconSettings, label: 'Administración del Sistema', desc: 'Gestión de usuarios, roles, permisos, respaldos automáticos, logs de actividad, parámetros globales de la finca.' },
  { icon: IconSettings, label: 'Configuración', desc: 'Ajustes de perfil, preferencias, modo sencillo, notificaciones, personalización de interfaz, cambio de finca.' },
  { icon: IconPlant, label: 'Especies (Menú)', desc: 'Menú de acceso rápido a especies: bovinos, porcinos, aves, equinos, ovinos, caprinos, caninos, felinos, conejos.' },
  { icon: IconPig, label: 'Avícola', desc: 'Gestión de aves: pollos de engorde, gallinas ponedoras, patos. Control de lotes, alimentación, producción de huevos, mortalidad.' },
  { icon: IconPig, label: 'Porcícola', desc: 'Gestión de cerdos: verracos, hembras, lechones, ceba. Control de monta, gestación, partos, destete, conversión alimenticia.' },
  { icon: IconFish, label: 'Apicultura', desc: 'Gestión de abejas: colmenas, reinas, producción de miel, polen, cera. Control de sanidad y floración.' },
  { icon: IconPaw, label: 'Equinos', desc: 'Gestión de caballos: registro, pedigrí, competencias, herrajes, salud, alimentación, calendario de vacunación equina.' },
  { icon: IconPaw, label: 'Caninos y Felinos', desc: 'Gestión de perros y gatos de la finca: registro, vacunación, desparasitación, control reproductivo, historial clínico.' },
  { icon: IconPaw, label: 'Pequeños Mamíferos', desc: 'Gestión de conejos, chigüiros, cuyes: reproducción, alimentación, sanidad, producción de carne y pieles.' },
]

const FAQ = [
  { q: '¿Cómo agrego un animal nuevo?', a: 'Ve al módulo Ganadería, haz clic en "Nuevo animal" y completa el formulario. Campos requeridos: código (chapeta/arete), especie, sexo y fecha de ingreso. Puedes agregar foto, raza, peso inicial y grupo de manejo.' },
  { q: '¿Cómo registro un pesaje?', a: 'Desde la ficha del animal en la sección Pesajes haz clic en "Nuevo pesaje". Ingresa el peso en kg y la fecha. También puedes usar Modo Sencillo con el botón "Registrar peso" desde cualquier pantalla.' },
  { q: '¿Cómo asigno un animal a un grupo de manejo?', a: 'Desde la ficha del animal edita el campo "Grupo de manejo" o usa la acción masiva seleccionando varios animales en la lista y usando "Asignar grupo".' },
  { q: '¿Cómo registro una vacunación?', a: 'Ve a la ficha del animal > Eventos sanitarios > Nuevo evento. Selecciona tipo "Vacunación", completa el medicamento, dosis y fecha. También puedes programarla desde Planeación.' },
  { q: '¿Cómo exportar mis datos?', a: 'Usa el módulo Reportes o el botón Exportar en cada módulo. Puedes descargar en CSV, Excel o PDF. Selecciona el periodo y los filtros deseados antes de exportar.' },
  { q: '¿Cómo cambio de finca?', a: 'Usa el selector de fincas en la barra superior. Puedes cambiar entre tus fincas registradas. Cada finca tiene sus propios datos independientes.' },
  { q: '¿Qué es Modo Sencillo?', a: 'Un modo simplificado que reemplaza el menú lateral por botones de acceso rápido (FAB). Permite registrar animales, eventos, pesos y más con menos pasos, desde cualquier pantalla.' },
  { q: '¿Dónde veo las alertas?', a: 'En el módulo Alertas (icono de campana). También puedes ver eventos pendientes desde la ficha de cada animal. Las alertas críticas también aparecen en el Dashboard.' },
  { q: '¿Cómo programar actividades futuras?', a: 'Ve al módulo Planeación, haz clic en "Nueva actividad". Selecciona el tipo (vacunación, desparasitación, cosecha, etc.), fecha, responsable y animales o lotes asociados.' },
  { q: '¿Puedo usar AgroP sin internet?', a: 'Sí, AgroP funciona offline para consultas y registro de datos básicos. Los cambios se sincronizan automáticamente cuando recuperes conexión. Revisa el indicador de conexión en la barra superior.' },
  { q: '¿Cómo registro una cosecha?', a: 'Ve al módulo Cultivos, selecciona el cultivo activo, haz clic en "Cosechar". Ingresa la cantidad cosechada, unidad (kg, unidades, etc.), calidad y destino de la producción.' },
  { q: '¿Cómo llevar la contabilidad de mi finca?', a: 'Usa el módulo Contabilidad con el PUC colombiano integrado. Registra facturas de compra y venta, clasifica por cuentas contables, genera reportes de ingresos vs gastos.' },
  { q: '¿Cómo registro un trabajador?', a: 'Ve al módulo Trabajadores > Nuevo trabajador. Ingresa datos personales, tipo de contrato, salario, rol y afiliaciones a EPS, ARL, fondo de pensiones y caja de compensación.' },
  { q: '¿Cómo crear un presupuesto anual?', a: 'En Contabilidad ve a Presupuestos > Nuevo presupuesto. Define el periodo (año), las categorías de ingresos y gastos, y asigna montos proyectados. Puedes comparar contra ejecución real.' },
  { q: '¿Qué significa cada icono en el menú?', a: 'Los iconos representan cada módulo: cerdo=Ganadería, planta=Cultivos, mapa=Lotes, moneda=Contabilidad, calendario=Planeación, campana=Alertas, maleta=Inventario, gráfico=Estadísticas, engranaje=Configuración.' },
  { q: '¿Cómo recupero mi contraseña?', a: 'En la pantalla de inicio de sesión haz clic en "¿Olvidaste tu contraseña?". Ingresa tu correo electrónico y recibirás un enlace para restablecerla.' },
  { q: '¿Cómo agrego un lote en el mapa?', a: 'Ve a Lotes y Mapas, usa la herramienta de dibujo (polígono) para delimitar el lote directamente en el mapa. La medición de área se calcula automáticamente.' },
  { q: '¿Cómo genero un reporte de trazabilidad?', a: 'Ve al módulo Trazabilidad, busca el producto o animal por código QR o código interno. El sistema mostrará el historial completo desde el origen.' },
]

const GLOSARIO = [
  { term: 'BPA', desc: 'Buenas Prácticas Agrícolas — conjunto de principios y normas para garantizar la calidad e inocuidad en producción agrícola' },
  { term: 'BPM', desc: 'Buenas Prácticas de Manufactura — normas de producción, higiene y manipulación de alimentos' },
  { term: 'PUC', desc: 'Plan Único de Cuentas — catálogo de cuentas contables estandarizado obligatorio en Colombia para clasificar operaciones' },
  { term: 'SMMLV', desc: 'Salario Mínimo Mensual Legal Vigente — monto mínimo que debe recibir un trabajador en Colombia, actualizado anualmente' },
  { term: 'Chapeta', desc: 'Identificador físico del animal, también conocido como arete o caravana, único por animal en la finca' },
  { term: 'Grupo de manejo', desc: 'Agrupación de animales con características productivas similares (levante, ceba, vientres, toros) para facilitar su gestión' },
  { term: 'Raza', desc: 'Clasificación genética que define las características fenotípicas y productivas de un animal (p.ej. Brahman, Holstein, Angus)' },
  { term: 'Lote', desc: 'Porción de terreno delimitada para uso agrícola o pecuario, con área y ubicación definida' },
  { term: 'Parcela', desc: 'Subdivisión de un lote destinada a un cultivo o actividad específica' },
  { term: 'Silvopastoreo', desc: 'Sistema productivo que combina árboles, pastos y animales en una misma área para mayor sostenibilidad' },
  { term: 'Evento sanitario', desc: 'Cualquier registro relacionado con la salud del animal: vacunaciones, enfermedades, desparasitaciones, tratamientos' },
  { term: 'Pesaje', desc: 'Registro del peso del animal en una fecha determinada, usado para calcular GDP y monitorear crecimiento' },
  { term: 'GDP', desc: 'Ganancia Diaria de Peso — indicador clave de productividad en animales de ceba, calculado en gramos/día' },
  { term: 'Conversión alimenticia', desc: 'Relación entre el alimento consumido y el peso ganado. A menor conversión, mayor eficiencia' },
  { term: 'ICA', desc: 'Instituto Colombiano Agropecuario — entidad estatal encargada de la sanidad animal y vegetal en Colombia' },
  { term: 'ARL', desc: 'Administradora de Riesgos Laborales — entidad aseguradora que cubre accidentes de trabajo y enfermedades laborales' },
  { term: 'EPS', desc: 'Entidad Promotora de Salud — aseguradora del sistema de salud colombiano que afilia a los trabajadores' },
  { term: 'AFP', desc: 'Administradora de Fondos de Pensiones — entidad que gestiona el ahorro pensional del trabajador' },
  { term: 'CCF', desc: 'Caja de Compensación Familiar — entidad que brinda subsidios y servicios sociales al trabajador y su familia' },
  { term: 'Finca', desc: 'Unidad productiva agropecuaria, también llamada predio, vereda o hacienda' },
  { term: 'Rotación de cultivos', desc: 'Alternancia de diferentes cultivos en un mismo lote para preservar la fertilidad del suelo y controlar plagas' },
  { term: 'Forraje', desc: 'Pastos, hierbas y plantas utilizadas como alimento para animales de producción' },
  { term: 'Ensilaje', desc: 'Método de conservación de forraje mediante fermentación anaeróbica para alimentación animal en épocas secas' },
  { term: 'Concentrado', desc: 'Alimento balanceado industrializado para animales, formulado según requerimientos nutricionales específicos' },
  { term: 'EPI', desc: 'Elemento de Protección Individual — equipo de seguridad laboral: cascos, guantes, botas, overoles, tapabocas' },
  { term: 'SST', desc: 'Seguridad y Salud en el Trabajo — disciplina que protege la integridad física y mental de los trabajadores' },
  { term: 'Matriz de peligros', desc: 'Herramienta SST que identifica, evalúa y controla los riesgos laborales por área de trabajo' },
  { term: 'Producción', desc: 'Cantidad de producto generado en la finca: litros de leche, kg de carne, unidades de huevos, toneladas de granos' },
  { term: 'Trazabilidad', desc: 'Sistema que permite seguir el rastro de un producto desde su origen hasta el consumidor final' },
  { term: 'Blockchain', desc: 'Tecnología de registro distribuido para garantizar la inmutabilidad y transparencia de la trazabilidad' },
  { term: 'QR', desc: 'Código de barras bidimensional que almacena información legible mediante escáner o cámara' },
  { term: 'Inseminación artificial', desc: 'Técnica reproductiva que deposita semen en el tracto reproductivo de la hembra sin monta natural' },
  { term: 'Transferencia de embriones', desc: 'Técnica reproductiva avanzada que transfiere embriones de donantes a receptoras' },
  { term: 'Perímetro', desc: 'Límite o contorno de un lote o terreno, medido en metros lineales' },
  { term: 'Hectárea', desc: 'Unidad de medida de superficie equivalente a 10,000 m² o 100 áreas' },
  { term: 'Topografía', desc: 'Descripción detallada de las características físicas del terreno: pendientes, elevaciones, accidentes geográficos' },
]

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'Búsqueda global en el sistema' },
  { keys: ['Ctrl', 'N'], desc: 'Crear nuevo registro (según módulo actual)' },
  { keys: ['Ctrl', 'E'], desc: 'Exportar datos del módulo actual' },
  { keys: ['Ctrl', 'H'], desc: 'Abrir / cerrar ayuda contextual' },
  { keys: ['Ctrl', 'M'], desc: 'Alternar Modo Sencillo' },
  { keys: ['Escape'], desc: 'Cerrar modal o panel abierto' },
  { keys: ['F5'], desc: 'Recargar datos del módulo actual' },
  { keys: ['Ctrl', 'S'], desc: 'Guardar formulario actual' },
  { keys: ['Ctrl', 'F'], desc: 'Buscar en listados del módulo' },
  { keys: ['Ctrl', 'P'], desc: 'Imprimir reporte / vista actual' },
  { keys: ['Ctrl', 'Enter'], desc: 'Enviar formulario activo' },
  { keys: ['?'], desc: 'Mostrar atajos de teclado' },
  { keys: ['Ctrl', 'Shift', 'A'], desc: 'Crear animal rápido' },
  { keys: ['Ctrl', 'Shift', 'E'], desc: 'Registrar evento sanitario rápido' },
  { keys: ['Ctrl', 'Shift', 'P'], desc: 'Registrar pesaje rápido' },
  { keys: ['Ctrl', 'Shift', 'V'], desc: 'Abrir asistente virtual' },
  { keys: ['Ctrl', 'B'], desc: 'Ir al Dashboard' },
  { keys: ['Alt', '1'], desc: 'Ir a Ganadería' },
  { keys: ['Alt', '2'], desc: 'Ir a Cultivos' },
  { keys: ['Alt', '3'], desc: 'Ir a Lotes y Mapas' },
  { keys: ['Alt', '4'], desc: 'Ir a Contabilidad' },
  { keys: ['Ctrl', 'Shift', 'R'], desc: 'Recargar todos los datos' },
  { keys: ['Ctrl', 'Z'], desc: 'Deshacer última acción' },
  { keys: ['Delete'], desc: 'Eliminar registro seleccionado' },
]

export default function ManualUsuario({ opened, onClose }) {
  const [moduloSearch, setModuloSearch] = useState('')
  const [faqSearch, setFaqSearch] = useState('')
  const [glosarioSearch, setGlosarioSearch] = useState('')

  const filteredModules = useMemo(() => {
    if (!moduloSearch) return MODULES
    const q = moduloSearch.toLowerCase()
    return MODULES.filter(m => m.label.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q))
  }, [moduloSearch])

  const filteredFaq = useMemo(() => {
    if (!faqSearch) return FAQ
    const q = faqSearch.toLowerCase()
    return FAQ.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }, [faqSearch])

  const filteredGlosario = useMemo(() => {
    if (!glosarioSearch) return GLOSARIO
    const q = glosarioSearch.toLowerCase()
    return GLOSARIO.filter(g => g.term.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q))
  }, [glosarioSearch])

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
              Permite administrar animales, cultivos, lotes, contabilidad, inventario, trabajadores y más desde una plataforma web moderna
              con soporte offline y multi-finca.
            </Text>
            <Title order={5} mt="md">Características principales</Title>
            <List>
              <List.Item>Gestión completa de ganadería: bovinos, porcinos, aves, equinos, ovinos, caprinos</List.Item>
              <List.Item>Administración de cultivos, siembras, cosechas y tratamientos</List.Item>
              <List.Item>Mapas interactivos con delimitación de lotes y medición de áreas</List.Item>
              <List.Item>Contabilidad completa con PUC colombiano integrado</List.Item>
              <List.Item>Nómina, trabajadores y SST</List.Item>
              <List.Item>Alertas y planeación de actividades</List.Item>
              <List.Item>Reportes exportables a CSV, Excel y PDF</List.Item>
              <List.Item>Soporte offline con sincronización automática</List.Item>
              <List.Item>Multi-finca y multi-usuario con roles y permisos</List.Item>
              <List.Item>Asistente virtual con lenguaje natural</List.Item>
            </List>
            <Title order={5} mt="md">Requisitos del sistema</Title>
            <List>
              <List.Item>Navegador web moderno (Chrome 90+, Firefox 90+, Edge 90+, Safari 15+)</List.Item>
              <List.Item>Conexión a internet (con soporte offline parcial)</List.Item>
              <List.Item>Resolución de pantalla mínima: 1024x768</List.Item>
              <List.Item>Cuenta de usuario con rol asignado por el administrador</List.Item>
            </List>
            <Title order={5} mt="md">Roles disponibles</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {[
                { role: 'Dueño/Admin', desc: 'Acceso completo a todos los módulos, configuración y administración del sistema' },
                { role: 'Veterinario', desc: 'Enfoque en animales, salud, eventos sanitarios, planeación y alertas' },
                { role: 'Capataz', desc: 'Enfoque en cultivos, lotes, operaciones, trabajadores y planeación' },
                { role: 'Contador', desc: 'Enfoque en contabilidad, inventario, nómina, estadísticas y consolidado' },
                { role: 'Asistente', desc: 'Acceso a animales, cultivos, plantillas y reportes básicos' },
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
            <Title order={4}>Primeros pasos en AgroP</Title>
            <List spacing="md">
              <List.Item><strong>Inicio de sesión:</strong> Ingresa con tu correo electrónico y contraseña proporcionados por el administrador. Si eres nuevo, solicita tu cuenta al administrador de la finca.</List.Item>
              <List.Item><strong>Seleccionar finca:</strong> En la barra superior elige la finca con la que deseas trabajar. Cada finca tiene datos independientes.</List.Item>
              <List.Item><strong>Navegación:</strong> Usa el menú lateral para acceder a los diferentes módulos. El menú está organizado en secciones: Producción, Especies, Gestión, Análisis y Sistema.</List.Item>
              <List.Item><strong>Modo Sencillo:</strong> Actívalo desde el menú de usuario (tu avatar) para acceso rápido a funciones comunes como registrar animales, eventos y pesos desde cualquier pantalla.</List.Item>
              <List.Item><strong>Agregar datos:</strong> Comienza registrando tus animales y cultivos usando los botones "Nuevo" en cada módulo.</List.Item>
              <List.Item><strong>Asistente virtual:</strong> Usa el botón flotante de mensaje (abajo a la derecha) para hacer preguntas en lenguaje natural sobre tus datos.</List.Item>
              <List.Item><strong>Ayuda contextual:</strong> Pulsa Ctrl+H o el botón de ayuda (abajo a la izquierda) para ver tips del módulo actual.</List.Item>
            </List>
            <Title order={5} mt="md">Navegación principal</Title>
            <Text size="sm">
              El menú lateral está organizado en secciones:
            </Text>
            <List>
              <List.Item><strong>Producción:</strong> Dashboard, Ganadería, Cultivos, Lotes, Operaciones, Grupos Manejo, Plantillas, Planeación, Equipos, Alertas, Farmacia, Agua, Alimentación, Picicultura, Suelos, Sensores, Forestal</List.Item>
              <List.Item><strong>Especies:</strong> Menú de especies para filtrar por tipo: avícola, porcícola, apicultura, equinos, caninos/felinos, pequeños mamíferos</List.Item>
              <List.Item><strong>Gestión:</strong> Contabilidad, Nómina, Inventario, Trabajadores, Mensajería, SST, Bioseguridad, Procedimientos Vet, Certificaciones, Trazabilidad</List.Item>
              <List.Item><strong>Análisis:</strong> Estadísticas, Recomendaciones, Reportes</List.Item>
              <List.Item><strong>Sistema:</strong> Cumplimiento, Admin Sistema, Configuración</List.Item>
            </List>
            <Text size="sm" mt="md">
              Puedes colapsar el menú lateral en pantallas pequeñas usando el icono de hamburguesa en la barra superior.
            </Text>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="modulos">
          <Stack gap="sm">
            <TextInput
              placeholder="Buscar módulos..."
              value={moduloSearch}
              onChange={e => setModuloSearch(e.currentTarget.value)}
              mb="sm"
            />
            {filteredModules.length === 0 && (
              <Text size="sm" c="dimmed">No se encontraron módulos para "{moduloSearch}"</Text>
            )}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {filteredModules.map(m => (
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
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="faq">
          <Stack gap="md">
            <TextInput
              placeholder="Buscar preguntas frecuentes..."
              value={faqSearch}
              onChange={e => setFaqSearch(e.currentTarget.value)}
              mb="sm"
            />
            {filteredFaq.length === 0 && (
              <Text size="sm" c="dimmed">No se encontraron preguntas para "{faqSearch}"</Text>
            )}
            {filteredFaq.map((item, i) => (
              <Paper key={i} p="sm" withBorder>
                <Text fw={600} size="sm">{item.q}</Text>
                <Text size="sm" mt={4} c="dimmed">{item.a}</Text>
              </Paper>
            ))}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="glosario">
          <Stack gap="sm">
            <TextInput
              placeholder="Buscar términos..."
              value={glosarioSearch}
              onChange={e => setGlosarioSearch(e.currentTarget.value)}
              mb="sm"
            />
            {filteredGlosario.length === 0 && (
              <Text size="sm" c="dimmed">No se encontraron términos para "{glosarioSearch}"</Text>
            )}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {filteredGlosario.map(g => (
                <Paper key={g.term} p="xs" withBorder>
                  <Group gap="xs" wrap="nowrap">
                    <Badge size="lg" variant="filled" color="blue" style={{ minWidth: 70, flexShrink: 0 }}>{g.term}</Badge>
                    <Text size="sm">{g.desc}</Text>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="atajos">
          <Stack gap="md">
            <Title order={4}>Atajos de teclado</Title>
            <Text size="sm" c="dimmed">Usa estos atajos para navegar y operar más rápido en AgroP.</Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {SHORTCUTS.map(s => (
                <Paper key={s.keys.join('')} p="xs" withBorder>
                  <Group gap="xs" wrap="nowrap">
                    <Group gap={2} wrap="nowrap">
                      {s.keys.map(k => <Kbd key={k} size="sm">{k}</Kbd>)}
                    </Group>
                    <Text size="sm">{s.desc}</Text>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="soporte">
          <Stack gap="md">
            <Title order={4}>¿Necesitas ayuda?</Title>
            <Text>
              Si tienes preguntas, encuentras un error o necesitas capacitación, puedes contactarnos a través de los siguientes canales:
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Paper p="md" withBorder>
                <Text fw={600} size="sm">Soporte técnico</Text>
                <Text size="xs" c="dimmed" mt={4}>Correo: soporte@agrop.com</Text>
                <Text size="xs" c="dimmed">WhatsApp: +57 300 000 0000</Text>
                <Text size="xs" c="dimmed">Teléfono: 01-800-000-0000</Text>
              </Paper>
              <Paper p="md" withBorder>
                <Text fw={600} size="sm">Documentación</Text>
                <Text size="xs" c="dimmed" mt={4}>Web: <Anchor href="https://agrop.com/docs" target="_blank">agrop.com/docs</Anchor></Text>
                <Text size="xs" c="dimmed">API: <Anchor href="https://agrop.com/api" target="_blank">agrop.com/api</Anchor></Text>
                <Text size="xs" c="dimmed">Estado: <Anchor href="https://status.agrop.com" target="_blank">status.agrop.com</Anchor></Text>
              </Paper>
              <Paper p="md" withBorder>
                <Text fw={600} size="sm">Capacitación</Text>
                <Text size="xs" c="dimmed" mt={4}>Solicita una capacitación virtual o presencial</Text>
                <Text size="xs" c="dimmed">Incluye materiales, guías y certificado</Text>
                <Text size="xs" c="dimmed">Duración: 4-8 horas según necesidades</Text>
              </Paper>
              <Paper p="md" withBorder>
                <Text fw={600} size="sm">Reportar errores</Text>
                <Text size="xs" c="dimmed" mt={4}>Reporta errores o sugiere mejoras a:</Text>
                <Text size="xs" c="dimmed">Correo: mejoras@agrop.com</Text>
                <Text size="xs" c="dimmed">Incluye captura de pantalla y descripción</Text>
              </Paper>
            </SimpleGrid>
            <Text size="sm" c="dimmed" mt="md">
              Horario de atención: Lunes a viernes de 8:00 AM a 6:00 PM. Sábados de 8:00 AM a 12:00 PM.
              Festivos: servicio de mensajería con respuesta en 24 horas hábiles.
            </Text>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
