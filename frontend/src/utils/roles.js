export const ROLE_HOMES = {
  admin: '/inicio-propietario',
  veterinario: '/inicio-veterinario',
  capataz: '/inicio-capataz',
  contador: '/inicio-contador',
  asistente: '/inicio-asistente',
}

export const getHomeForRole = (role) => ROLE_HOMES[role] || '/inicio-propietario'
