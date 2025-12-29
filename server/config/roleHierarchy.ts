/**
 * Hierarquia de Roles e Permissões
 *
 * Regras:
 * - Super Admin: Pode cadastrar e ver todos os usuários
 * - Administrator: Pode cadastrar e ver todos exceto Super Admin
 * - Manager: Pode cadastrar e ver apenas Partner e Client (não vê Super Admin e Administrator)
 * - Partner: Apenas visualiza seus próprios dados
 * - Client: Apenas visualiza seus próprios dados
 */

export enum Role {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  ADMINISTRATOR = 'administrator',
  MANAGER = 'manager',
  PARTNER = 'partner',
  CLIENT = 'client'
}

// Níveis de hierarquia (quanto maior, mais poder)
export const ROLE_HIERARCHY: Record<string, number> = {
  [Role.SUPERADMIN]: 5,
  [Role.ADMINISTRATOR]: 4,
  [Role.ADMIN]: 4, // admin e administrator no mesmo nível
  [Role.MANAGER]: 3,
  [Role.PARTNER]: 2,
  [Role.CLIENT]: 1
}

/**
 * Retorna o nível hierárquico de um role
 */
export function getRoleLevel(role: string): number {
  const normalizedRole = role.toLowerCase()
  return ROLE_HIERARCHY[normalizedRole] || 0
}

/**
 * Verifica se um role pode criar outro role
 */
export function canCreateRole(creatorRole: string, targetRole: string): boolean {
  const creatorLevel = getRoleLevel(creatorRole)
  const targetLevel = getRoleLevel(targetRole)

  // Pode criar roles de nível igual ou inferior
  return creatorLevel >= targetLevel
}

/**
 * Verifica se um role pode visualizar outro role
 */
export function canViewRole(viewerRole: string, targetRole: string): boolean {
  const viewerLevel = getRoleLevel(viewerRole)
  const targetLevel = getRoleLevel(targetRole)

  // Superadmin vê todos
  if (viewerRole.toLowerCase() === Role.SUPERADMIN) {
    return true
  }

  // Administrator vê todos exceto superadmin
  if (viewerRole.toLowerCase() === Role.ADMINISTRATOR || viewerRole.toLowerCase() === Role.ADMIN) {
    return targetRole.toLowerCase() !== Role.SUPERADMIN
  }

  // Manager vê apenas partner e client (não vê superadmin e administrator)
  if (viewerRole.toLowerCase() === Role.MANAGER) {
    return targetLevel < getRoleLevel(Role.ADMINISTRATOR)
  }

  // Outros só veem a si mesmos
  return false
}

/**
 * Retorna os roles que um usuário pode criar
 */
export function getCreatableRoles(userRole: string): string[] {
  const userLevel = getRoleLevel(userRole)

  return Object.entries(ROLE_HIERARCHY)
    .filter(([role, level]) => level <= userLevel)
    .map(([role]) => role)
    .sort((a, b) => getRoleLevel(b) - getRoleLevel(a))
}

/**
 * Retorna os roles que um usuário pode visualizar
 */
export function getViewableRoles(userRole: string): string[] {
  const normalizedRole = userRole.toLowerCase()

  // Superadmin vê todos
  if (normalizedRole === Role.SUPERADMIN) {
    return Object.keys(ROLE_HIERARCHY)
  }

  // Administrator vê todos exceto superadmin
  if (normalizedRole === Role.ADMINISTRATOR || normalizedRole === Role.ADMIN) {
    return Object.keys(ROLE_HIERARCHY)
      .filter(role => role !== Role.SUPERADMIN)
  }

  // Manager vê apenas partner e client
  if (normalizedRole === Role.MANAGER) {
    return [Role.MANAGER, Role.PARTNER, Role.CLIENT]
  }

  // Outros só veem a si mesmos
  return [normalizedRole]
}

/**
 * Filtra uma lista de usuários baseado nas permissões de visualização
 */
export function filterUsersByPermission(users: any[], viewerRole: string): any[] {
  const viewableRoles = getViewableRoles(viewerRole)

  return users.filter(user => {
    const userRole = (user.role || '').toLowerCase()
    return viewableRoles.includes(userRole)
  })
}
