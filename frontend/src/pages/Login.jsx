import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container, Paper, Title, TextInput, PasswordInput,
  Button, Text, Stack, Alert, Anchor, Group, ActionIcon,
} from '@mantine/core'
import { IconPlant, IconAlertCircle, IconLanguage } from '@tabler/icons-react'
import { useAuth } from '../store/AuthContext.jsx'
import { useIdioma } from '../store/IdiomaContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('admin@agrop.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const { t, idioma, setIdioma, IDIOMAS } = useIdioma()
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
      <Paper radius="md" p="xl" withBorder shadow="md" style={{ position: 'relative' }}>
        <Group justify="flex-end" mb="sm">
          {Object.entries(IDIOMAS).map(([key, lang]) => (
            <ActionIcon
              key={key}
              variant={idioma === key ? 'filled' : 'subtle'}
              color="green"
              onClick={() => setIdioma(key)}
              size="sm"
            >
              <Text size="lg">{lang.bandera}</Text>
            </ActionIcon>
          ))}
        </Group>
        <Stack align="center" mb="lg">
          <IconPlant size={48} color="var(--mantine-color-green-7)" />
          <Title order={2}>AgroP</Title>
          <Text size="sm" c="dimmed">{t('login_subtitulo')}</Text>
        </Stack>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" variant="light">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label={t('login_email')}
              placeholder={t('login_placeholder_email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordInput
              label={t('login_password')}
              placeholder={t('login_placeholder_password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" fullWidth loading={loading} mt="md">
              {t('login_ingresar')}
            </Button>
          </Stack>
        </form>

        <Text size="xs" c="dimmed" ta="center" mt="xl">
          {t('login_hint')}
        </Text>
      </Paper>
    </Container>
  )
}
