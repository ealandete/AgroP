import { Paper, Group, Stack, Text, Skeleton, ActionIcon, ThemeIcon, Tooltip, Box } from '@mantine/core'
import { IconX, IconSettings, IconRefresh, IconAlertTriangle } from '@tabler/icons-react'

function WidgetSkeleton({ height }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap={6}>
            <Skeleton height={24} width={24} radius="xl" />
            <Skeleton height={16} width={120} />
          </Group>
          <Group gap={4}>
            <Skeleton height={24} width={24} radius="sm" />
            <Skeleton height={24} width={24} radius="sm" />
          </Group>
        </Group>
        <Skeleton height={height || 160} radius="sm" />
      </Stack>
    </Paper>
  )
}

function WidgetError({ message, onRetry }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack align="center" gap="xs" py="lg">
        <ThemeIcon variant="light" size="lg" radius="xl" color="red">
          <IconAlertTriangle size={20} />
        </ThemeIcon>
        <Text size="sm" c="red" ta="center">{message || 'Error al cargar el widget'}</Text>
        {onRetry && (
          <ActionIcon variant="subtle" color="red" size="sm" onClick={onRetry}>
            <IconRefresh size={14} />
          </ActionIcon>
        )}
      </Stack>
    </Paper>
  )
}

function WidgetEmpty({ message, icon: EmptyIcon }) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack align="center" gap="xs" py="lg">
        {EmptyIcon && (
          <ThemeIcon variant="light" size="lg" radius="xl" color="gray">
            <EmptyIcon size={20} />
          </ThemeIcon>
        )}
        <Text size="sm" c="dimmed" ta="center">{message || 'Sin datos disponibles'}</Text>
      </Stack>
    </Paper>
  )
}

export default function DashboardWidget({
  title, icon: Icon, children, color = 'blue', width = 'full',
  onRemove, onSettings, onRefresh, loading, error, isEmpty, emptyMessage,
  skeletonHeight, rightSection,
}) {
  if (loading) return <WidgetSkeleton height={skeletonHeight} />
  if (error) return <WidgetError message={error} onRetry={onRefresh} />
  if (isEmpty) return <WidgetEmpty message={emptyMessage} icon={Icon} />

  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
    >
      <Group justify="space-between" mb="sm" wrap="nowrap">
        <Group gap={6} style={{ minWidth: 0, flex: 1 }}>
          {Icon && (
            <ThemeIcon variant="light" size="sm" radius="md" color={color}>
              <Icon size={14} />
            </ThemeIcon>
          )}
          <Text fw={600} size="sm" lineClamp={1}>{title}</Text>
        </Group>
        <Group gap={2} wrap="nowrap">
          {rightSection}
          {onRefresh && (
            <Tooltip label="Actualizar">
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={onRefresh}>
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {onSettings && (
            <Tooltip label="Configurar">
              <ActionIcon variant="subtle" color="gray" size="sm" onClick={onSettings}>
                <IconSettings size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {onRemove && (
            <Tooltip label="Quitar widget">
              <ActionIcon variant="subtle" color="red" size="sm" onClick={onRemove}>
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>
      <Box style={{ flex: 1, minHeight: 0 }}>
        {children}
      </Box>
    </Paper>
  )
}
