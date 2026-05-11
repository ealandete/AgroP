import { Stack, Group, Skeleton, Paper, SimpleGrid } from '@mantine/core'

function TableSkeleton() {
  return (
    <Stack gap="xs">
      {Array.from({ length: 5 }).map((_, i) => (
        <Group key={i} gap="xs" wrap="nowrap">
          {Array.from({ length: 6 }).map((_, j) => (
            <Skeleton key={j} height={24} style={{ flex: j === 0 ? 2 : 1 }} />
          ))}
        </Group>
      ))}
    </Stack>
  )
}

function CardsSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      {Array.from({ length: 3 }).map((_, i) => (
        <Paper key={i} p="md" radius="md" withBorder>
          <Stack gap="sm">
            <Skeleton height={20} width="60%" />
            <Skeleton height={14} />
            <Skeleton height={14} width="80%" />
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  )
}

const CHART_BAR_HEIGHTS = [60, 100, 40, 140, 80, 120, 50, 90]

function ChartSkeleton() {
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Skeleton height={20} width={120} />
        <Group gap="xs" align="flex-end" style={{ height: 180 }}>
          {CHART_BAR_HEIGHTS.map((h, i) => (
            <Skeleton key={i} style={{ flex: 1 }} height={`${h}px`} />
          ))}
        </Group>
      </Stack>
    </Paper>
  )
}

function DetailSkeleton() {
  return (
    <Stack gap="md">
      {Array.from({ length: 4 }).map((_, i) => (
        <Group key={i} gap="xs" align="center" wrap="nowrap">
          <Skeleton height={14} width={100} />
          <Skeleton height={36} style={{ flex: 1 }} />
        </Group>
      ))}
    </Stack>
  )
}

function MapSkeleton() {
  return (
    <Skeleton
      height={300}
      radius="md"
      style={{
        backgroundColor: 'var(--mantine-color-green-1)',
        border: '2px dashed var(--mantine-color-green-4)',
      }}
    />
  )
}

export default function LoadingSkeleton({ variant = 'table' }) {
  switch (variant) {
    case 'table':
      return <TableSkeleton />
    case 'cards':
      return <CardsSkeleton />
    case 'chart':
      return <ChartSkeleton />
    case 'detail':
      return <DetailSkeleton />
    case 'map':
      return <MapSkeleton />
    default:
      return <TableSkeleton />
  }
}
