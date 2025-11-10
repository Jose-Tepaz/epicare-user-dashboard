/**
 * Hooks Compartidos para Epicare Dashboard
 * Hooks para consumir datos de Supabase de manera eficiente
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Application,
  ApplicationWithDetails,
  DashboardStats,
  UserProfile,
  UseApplicationsReturn,
  UseApplicationReturn,
  UseUserProfileReturn,
  UseDashboardStatsReturn,
  ApplicationStatus
} from '../SHARED-TYPES'

// ============================================
// HOOK PARA OBTENER APLICACIONES DEL USUARIO
// ============================================

export function useApplications(userId: string | null): UseApplicationsReturn {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchApplications = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('applications')
        .select(`
          *,
          applicants(*),
          coverages(*),
          beneficiaries(*),
          application_submission_results(*),
          application_payment_transactions(*),
          application_validation_errors(*),
          application_status_history(*),
          insurance_companies(name, slug, logo_url),
          agents(name, agent_code)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setApplications(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar aplicaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [userId])

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications
  }
}

// ============================================
// HOOK PARA OBTENER UNA APLICACIÓN ESPECÍFICA
// ============================================

export function useApplication(applicationId: string | null): UseApplicationReturn {
  const [application, setApplication] = useState<ApplicationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchApplication = async () => {
    if (!applicationId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('applications')
        .select(`
          *,
          applicants(*),
          coverages(*),
          beneficiaries(*),
          application_submission_results(*),
          application_payment_transactions(*),
          application_validation_errors(*),
          application_status_history(*),
          insurance_companies(name, slug, logo_url),
          agents(name, agent_code)
        `)
        .eq('id', applicationId)
        .single()

      if (fetchError) throw fetchError

      setApplication(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar aplicación')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplication()
  }, [applicationId])

  return {
    application,
    loading,
    error,
    refetch: fetchApplication
  }
}

// ============================================
// HOOK PARA OBTENER PERFIL DEL USUARIO
// ============================================

export function useUserProfile(userId: string | null): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Obtener perfil del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Obtener roles del usuario
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          roles(*)
        `)
        .eq('user_id', userId)

      if (rolesError) throw rolesError

      // Obtener conteo de aplicaciones
      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Obtener conteo de pólizas activas
      const { count: activePoliciesCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')

      const roles = rolesData?.map((ur: any) => ur.roles).filter(Boolean) || []

      setProfile({
        ...userData,
        roles,
        applications_count: applicationsCount || 0,
        active_policies_count: activePoliciesCount || 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar perfil')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId)

      if (error) throw error

      // Refrescar datos
      await fetchProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil')
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [userId])

  return {
    profile,
    loading,
    error,
    updateProfile
  }
}

// ============================================
// HOOK PARA OBTENER ESTADÍSTICAS DEL DASHBOARD
// ============================================

export function useDashboardStats(userId: string | null): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchStats = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Obtener aplicaciones del usuario
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('status, coverages(monthly_premium)')
        .eq('user_id', userId)

      if (appsError) throw appsError

      // Calcular estadísticas
      const totalApplications = applications?.length || 0
      const activePolicies = applications?.filter(app => app.status === 'active').length || 0
      const pendingApplications = applications?.filter(app => 
        ['submitted', 'pending_approval'].includes(app.status)
      ).length || 0

      // Calcular total de primas mensuales
      const totalMonthlyPremium = applications
        ?.filter(app => app.status === 'active')
        ?.reduce((total, app) => {
          const premium = app.coverages?.reduce((sum: number, coverage: any) => 
            sum + (coverage.monthly_premium || 0), 0) || 0
          return total + premium
        }, 0) || 0

      // Agrupar por estado
      const applicationsByStatus = applications?.reduce((acc, app) => {
        acc[app.status as ApplicationStatus] = (acc[app.status as ApplicationStatus] || 0) + 1
        return acc
      }, {} as Record<ApplicationStatus, number>) || {}

      setStats({
        total_applications: totalApplications,
        active_policies: activePolicies,
        pending_applications: pendingApplications,
        total_monthly_premium: totalMonthlyPremium,
        applications_by_status: applicationsByStatus
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [userId])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

// ============================================
// HOOK PARA OBTENER TRANSACCIONES DE PAGO
// ============================================

export function usePaymentTransactions(applicationId: string | null) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTransactions = async () => {
    if (!applicationId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('application_payment_transactions')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setTransactions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [applicationId])

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions
  }
}

// ============================================
// HOOK PARA OBTENER RESULTADOS DE SUBMISSION
// ============================================

export function useSubmissionResults(applicationId: string | null) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchResults = async () => {
    if (!applicationId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('application_submission_results')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setResults(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar resultados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [applicationId])

  return {
    results,
    loading,
    error,
    refetch: fetchResults
  }
}

// ============================================
// HOOK PARA OBTENER HISTORIAL DE ESTADOS
// ============================================

export function useApplicationStatusHistory(applicationId: string | null) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchHistory = async () => {
    if (!applicationId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('application_status_history')
        .select(`
          *,
          changed_by_user:changed_by(email)
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setHistory(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [applicationId])

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  }
}

// ============================================
// HOOK PARA OBTENER ASEGURADORAS
// ============================================

export function useInsuranceCompanies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (fetchError) throw fetchError

      setCompanies(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar aseguradoras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  return {
    companies,
    loading,
    error,
    refetch: fetchCompanies
  }
}

// ============================================
// UTILIDADES ADICIONALES
// ============================================

export function useApplicationStatusDisplay(status: ApplicationStatus) {
  const statusDisplay = {
    draft: { label: 'Borrador', color: 'gray', description: 'Aplicación en proceso de creación' },
    submitted: { label: 'Enviada', color: 'blue', description: 'Aplicación enviada a la aseguradora' },
    pending_approval: { label: 'Pendiente', color: 'yellow', description: 'Esperando aprobación de la aseguradora' },
    approved: { label: 'Aprobada', color: 'green', description: 'Aplicación aprobada por la aseguradora' },
    rejected: { label: 'Rechazada', color: 'red', description: 'Aplicación rechazada por la aseguradora' },
    active: { label: 'Activa', color: 'green', description: 'Póliza activa y vigente' },
    cancelled: { label: 'Cancelada', color: 'red', description: 'Aplicación cancelada' },
    submission_failed: { label: 'Error de Envío', color: 'red', description: 'Error al enviar la aplicación' }
  }

  return statusDisplay[status]
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}
