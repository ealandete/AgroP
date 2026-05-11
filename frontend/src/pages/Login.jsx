import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container, Paper, Title, TextInput, PasswordInput,
  Button, Text, Stack, Alert, Anchor,
} from '@mantine/core'
import { IconPlant, IconAlertCircle } from '@tabler/icons-react'
import { useAuth } from '../store/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('admin@agrop.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    if (result.ok) {
      navigate('/')
    } else {
      setError(result.error)
    }
  }

  return (
    <Container size={420} my={80}>
      <Paper radius="md" p="xl" withBorder shadow="md">
        <Stack align="center" mb="lg">
          <IconPlant size={48} color="var(--mantine-color-green-7)" />
          <Title order={2}>AgroP</Title>
          <Text size="sm" c="dimmed">Sistema de Gestión Agropecuaria</Text>
        </Stack>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" variant="light">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="admin@agrop.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" fullWidth loading={loading} mt="md">
              Ingresar
            </Button>
          </Stack>
        </form>

        <Text size="xs" c="dimmed" ta="center" mt="xl">
          admin@agrop.local / admin123
        </Text>
      </Paper>
    </Container>
  )
}
