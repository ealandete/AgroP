import { Breadcrumbs as MantineBreadcrumbs, Anchor, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

export default function Breadcrumbs({ items = [] }) {
  const crumbs = [{ label: 'Inicio', href: '/' }, ...items]

  return (
    <MantineBreadcrumbs mb="md">
      {crumbs.map((item, index) => {
        const isLast = index === crumbs.length - 1
        if (isLast) {
          return (
            <Text size="sm" c="dimmed" key={item.href || index}>
              {item.label}
            </Text>
          )
        }
        return (
          <Anchor component={Link} to={item.href} size="sm" key={item.href || index}>
            {item.label}
          </Anchor>
        )
      })}
    </MantineBreadcrumbs>
  )
}
