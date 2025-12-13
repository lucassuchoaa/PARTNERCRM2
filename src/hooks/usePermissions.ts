import { useState, useEffect } from 'react'
import { getCurrentUser } from '../services/auth'
import { fetchWithAuth } from '../services/api/fetch-with-auth'
import { API_URL } from '../config/api'

interface Role {
  id: string
  name: string
  permissions: string[]
  is_active: boolean
}

interface PermissionState {
  permissions: string[]
  role: string | null
  loading: boolean
  isAdmin: boolean
}

// Cache para evitar multiplas requisicoes
let permissionsCache: { [userId: string]: string[] } = {}
let rolesCache: Role[] | null = null

export function usePermissions() {
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    role: null,
    loading: true,
    isAdmin: false
  })

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      const user = await getCurrentUser()

      if (!user) {
        setState({
          permissions: [],
          role: null,
          loading: false,
          isAdmin: false
        })
        return
      }

      // Admin tem todas as permissoes
      if (user.role === 'admin') {
        setState({
          permissions: ['*'],
          role: 'admin',
          loading: false,
          isAdmin: true
        })
        return
      }

      // Verificar cache
      if (permissionsCache[user.id]) {
        setState({
          permissions: permissionsCache[user.id],
          role: user.role,
          loading: false,
          isAdmin: false
        })
        return
      }

      // Buscar roles do servidor
      if (!rolesCache) {
        try {
          const response = await fetchWithAuth(`${API_URL}/api/roles`)
          const data = await response.json()
          if (data.success) {
            rolesCache = data.data
          }
        } catch (error) {
          console.error('Erro ao buscar roles:', error)
        }
      }

      // Encontrar a role do usuario
      if (rolesCache) {
        const userRole = rolesCache.find(
          r => r.name.toLowerCase() === user.role?.toLowerCase()
        )

        if (userRole) {
          const perms = typeof userRole.permissions === 'string'
            ? JSON.parse(userRole.permissions)
            : userRole.permissions

          permissionsCache[user.id] = perms
          setState({
            permissions: perms,
            role: user.role,
            loading: false,
            isAdmin: false
          })
          return
        }
      }

      // Fallback - permissoes padrao baseadas na role
      const defaultPermissions = getDefaultPermissions(user.role)
      permissionsCache[user.id] = defaultPermissions
      setState({
        permissions: defaultPermissions,
        role: user.role,
        loading: false,
        isAdmin: false
      })
    } catch (error) {
      console.error('Erro ao carregar permissoes:', error)
      setState({
        permissions: [],
        role: null,
        loading: false,
        isAdmin: false
      })
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (state.loading) return false
    if (state.isAdmin || state.permissions.includes('*')) return true
    return state.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (state.loading) return false
    if (state.isAdmin || state.permissions.includes('*')) return true
    return permissions.some(p => state.permissions.includes(p))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (state.loading) return false
    if (state.isAdmin || state.permissions.includes('*')) return true
    return permissions.every(p => state.permissions.includes(p))
  }

  const refreshPermissions = () => {
    permissionsCache = {}
    rolesCache = null
    loadPermissions()
  }

  return {
    ...state,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions
  }
}

// Permissoes padrao por role (fallback)
function getDefaultPermissions(role: string | null): string[] {
  switch (role?.toLowerCase()) {
    case 'admin':
      return ['*']

    case 'manager':
      return [
        'dashboard.view', 'dashboard.analytics',
        'clients.view', 'clients.create', 'clients.edit',
        'referrals.view', 'referrals.create', 'referrals.validate',
        'reports.view', 'reports.export', 'reports.all_partners',
        'support.view',
        'commissions.view'
      ]

    case 'partner':
      return [
        'dashboard.view',
        'clients.view', 'clients.create', 'clients.edit',
        'referrals.view', 'referrals.create',
        'reports.view',
        'support.view',
        'commissions.view'
      ]

    default:
      return ['dashboard.view']
  }
}

// Componente para verificacao condicional de permissoes
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}: {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

  if (loading) {
    return null
  }

  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>
  }

  if (permissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)

    return hasAccess ? <>{children}</> : <>{fallback}</>
  }

  return <>{children}</>
}

// Hook simplificado para verificacao rapida
export function useHasPermission(permission: string): boolean {
  const { hasPermission, loading } = usePermissions()
  return !loading && hasPermission(permission)
}

// Limpar cache (usar ao fazer logout)
export function clearPermissionsCache() {
  permissionsCache = {}
  rolesCache = null
}
