import { Table, Paper, Text, Group, Badge } from '@mantine/core'
import { useMobile } from '../hooks/useMobile.js'

export default function MobileTable({ columns, data, onRowClick }) {
  const isMobile = useMobile()

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.length === 0 && (
          <Text c="dimmed" ta="center" py="sm">Sin registros</Text>
        )}
        {data.map((row, i) => (
          <Paper
            key={row.id || i}
            withBorder
            p="sm"
            radius="md"
            style={{ cursor: onRowClick ? 'pointer' : 'default', minHeight: 44 }}
            onClick={() => onRowClick?.(row)}
          >
            {columns
              .filter(col => !col.hideOnMobile)
              .map(col => {
                const value = col.render ? col.render(row) : row[col.key]
                if (value === null || value === undefined || value === '') return null
                return (
                  <Group key={col.key} justify="space-between" mb={4} wrap="nowrap">
                    <Text size="xs" c="dimmed" fw={500}>{col.label}</Text>
                    <Text size="sm" style={{ textAlign: 'right', wordBreak: 'break-word' }}>
                      {value}
                    </Text>
                  </Group>
                )
              })}
          </Paper>
        ))}
      </div>
    )
  }

  return (
    <Paper withBorder style={{ overflowX: 'auto' }}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {columns.map(col => (
              <Table.Th key={col.key} visibleFrom={col.hideMobile ? 'sm' : undefined}>
                {col.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Text c="dimmed" ta="center" py="sm">Sin registros</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            data.map((row, i) => (
              <Table.Tr
                key={row.id || i}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <Table.Td key={col.key} visibleFrom={col.hideMobile ? 'sm' : undefined}>
                    {col.render ? col.render(row) : row[col.key]}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  )
}
