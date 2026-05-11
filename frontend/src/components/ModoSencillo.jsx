import { useState, useRef } from 'react'
import { Affix, ActionIcon, Paper, SimpleGrid, Tooltip, Stack, Text } from '@mantine/core'
import { IconPlus, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import {
  QuickAnimalForm, QuickEventForm, QuickWeightForm,
  QuickMilkForm, QuickSiembraForm, QuickTaskForm,
} from './QuickForms'

const FAB_ITEMS = [
  { icon: '🐮', label: 'Registrar animal', key: 'animal', color: 'orange' },
  { icon: '💉', label: 'Registrar evento', key: 'event', color: 'red' },
  { icon: '📏', label: 'Registrar peso', key: 'weight', color: 'blue' },
  { icon: '🥛', label: 'Registrar leche', key: 'milk', color: 'cyan' },
  { icon: '🌱', label: 'Registrar siembra', key: 'siembra', color: 'green' },
  { icon: '✅', label: 'Marcar actividad', key: 'task', color: 'grape' },
  { icon: '📸', label: 'Tomar foto', key: 'photo', color: 'yellow' },
  { icon: '📋', label: 'Mi día', key: 'mydia', color: 'teal' },
]

export default function ModoSencillo() {
  const [open, setOpen] = useState(false)
  const [activeForm, setActiveForm] = useState(null)
  const fileInputRef = useRef(null)

  const handleAction = (key) => {
    setOpen(false)
    if (key === 'photo') {
      fileInputRef.current?.click()
      return
    }
    setActiveForm(key)
  }

  const closeForm = () => setActiveForm(null)

  const handlePhotoCapture = (e) => {
    const file = e.target?.files?.[0]
    if (file) {
      notifications.show({ title: '📸 Foto capturada', message: file.name, color: 'green' })
    }
    if (e.target) e.target.value = ''
  }

  return (
    <>
      <Affix position={{ bottom: 24, right: 24 }} zIndex={1000}>
        <Stack gap="xs" align="end">
          {open && (
            <Paper shadow="lg" p="sm" withBorder style={{ borderRadius: 20 }}>
              <SimpleGrid cols={2} spacing="sm">
                {FAB_ITEMS.map(item => (
                  <Tooltip key={item.key} label={item.label} position="left" withArrow>
                    <ActionIcon
                      variant="filled"
                      color={item.color}
                      size={60}
                      radius="xl"
                      onClick={() => handleAction(item.key)}
                      styles={{ root: { fontSize: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } }}
                    >
                      {item.icon}
                    </ActionIcon>
                  </Tooltip>
                ))}
              </SimpleGrid>
            </Paper>
          )}
          <ActionIcon
            variant="filled"
            color={open ? 'red' : 'green'}
            size={64}
            radius="xl"
            onClick={() => setOpen(!open)}
            styles={{ root: { boxShadow: '0 4px 16px rgba(0,0,0,0.3)' } }}
          >
            {open ? <IconX size={32} /> : <IconPlus size={32} />}
          </ActionIcon>
        </Stack>
      </Affix>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handlePhotoCapture}
      />

      <QuickAnimalForm opened={activeForm === 'animal'} onClose={closeForm} />
      <QuickEventForm opened={activeForm === 'event'} onClose={closeForm} />
      <QuickWeightForm opened={activeForm === 'weight'} onClose={closeForm} />
      <QuickMilkForm opened={activeForm === 'milk'} onClose={closeForm} />
      <QuickSiembraForm opened={activeForm === 'siembra'} onClose={closeForm} />
      <QuickTaskForm opened={activeForm === 'task' || activeForm === 'mydia'} onClose={closeForm} />
    </>
  )
}
