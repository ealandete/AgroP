import { Stack, Text, Button, ThemeIcon } from '@mantine/core'
import { IconFileOff } from '@tabler/icons-react'

export default function EmptyState({
  icon: Icon = IconFileOff,
  title = 'Sin datos',
  description,
  action,
  image,
  compact = false,
}) {
  if (compact) {
    return (
      <Stack align="center" gap={2} py="md">
        <ThemeIcon variant="light" size="sm" radius="xl" color="gray">
          <Icon size={14} />
        </ThemeIcon>
        <Text size="xs" c="dimmed">{title}</Text>
        {description && <Text size="10px" c="dimmed">{description}</Text>}
        {action && (
          <Button size="xs" variant="light" color="gray" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </Stack>
    )
  }

  return (
    <Stack align="center" gap="md" py={60}>
      {image ? (
        <img src={image} alt="" style={{ maxWidth: 240, opacity: 0.7 }} />
      ) : (
        <ThemeIcon variant="light" size={80} radius={100} color="gray">
          <Icon size={40} />
        </ThemeIcon>
      )}
      <Text fw={600} size="lg" ta="center">{title}</Text>
      {description && (
        <Text size="sm" c="dimmed" ta="center" maw={400}>{description}</Text>
      )}
      {action && (
        <Button mt="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Stack>
  )
}
