import { Component } from 'react'
import { Container, Paper, Title, Text, Button, Group, Stack } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Container size="sm" py={80}>
          <Paper p="xl" radius="md" withBorder shadow="md">
            <Stack align="center" gap="md">
              <IconAlertTriangle size={64} color="var(--mantine-color-red-6)" />
              <Title order={2}>Algo sali&oacute; mal</Title>
              {import.meta.env.DEV && this.state.error && (
                <Text size="sm" c="red" ta="center" style={{ fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </Text>
              )}
              <Group mt="md">
                <Button color="red" onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
                <Button variant="outline" onClick={() => { window.location.href = '/' }}>
                  Volver al inicio
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Container>
      )
    }

    return this.props.children
  }
}
