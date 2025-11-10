/**
 * Configuración de Ejemplo para Epicare Dashboard
 * Copiar este archivo y personalizar según necesidades
 */

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

export const SUPABASE_CONFIG = {
  // Estas variables deben estar en .env.local
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  
  // Configuración de cookies para compartir entre dominios
  cookieOptions: {
    domain: process.env.NODE_ENV === 'production' ? '.epicare.com' : undefined,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7 // 7 días
  }
}

// ============================================
// CONFIGURACIÓN DE URLs
// ============================================

export const APP_URLS = {
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_URL || 'http://localhost:3000',
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001',
  
  // URLs de producción
  production: {
    marketplace: 'https://epicare.com',
    dashboard: 'https://dashboard.epicare.com'
  }
}

// ============================================
// CONFIGURACIÓN DE PAGINACIÓN
// ============================================

export const PAGINATION_CONFIG = {
  applicationsPerPage: 10,
  transactionsPerPage: 20,
  historyPerPage: 15,
  maxPagesToShow: 5
}

// ============================================
// CONFIGURACIÓN DE CACHÉ
// ============================================

export const CACHE_CONFIG = {
  // Tiempo de caché en segundos
  applications: 300, // 5 minutos
  userProfile: 600, // 10 minutos
  stats: 180, // 3 minutos
  companies: 3600, // 1 hora
  transactions: 60, // 1 minuto
  submissionResults: 120 // 2 minutos
}

// ============================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ============================================

export const NOTIFICATION_CONFIG = {
  // Tiempo de auto-dismiss en milisegundos
  autoDismissDelay: 5000,
  
  // Tipos de notificaciones
  types: {
    success: { color: 'green', icon: 'check' },
    error: { color: 'red', icon: 'x' },
    warning: { color: 'yellow', icon: 'alert-triangle' },
    info: { color: 'blue', icon: 'info' }
  }
}

// ============================================
// CONFIGURACIÓN DE ESTADOS DE APLICACIÓN
// ============================================

export const APPLICATION_STATUS_CONFIG = {
  draft: {
    label: 'Borrador',
    color: 'gray',
    description: 'Aplicación en proceso de creación',
    canEdit: true,
    canDelete: true,
    canSubmit: true
  },
  submitted: {
    label: 'Enviada',
    color: 'blue',
    description: 'Aplicación enviada a la aseguradora',
    canEdit: false,
    canDelete: false,
    canSubmit: false
  },
  pending_approval: {
    label: 'Pendiente',
    color: 'yellow',
    description: 'Esperando aprobación de la aseguradora',
    canEdit: false,
    canDelete: false,
    canSubmit: false
  },
  approved: {
    label: 'Aprobada',
    color: 'green',
    description: 'Aplicación aprobada por la aseguradora',
    canEdit: false,
    canDelete: false,
    canSubmit: false
  },
  rejected: {
    label: 'Rechazada',
    color: 'red',
    description: 'Aplicación rechazada por la aseguradora',
    canEdit: true,
    canDelete: true,
    canSubmit: true
  },
  active: {
    label: 'Activa',
    color: 'green',
    description: 'Póliza activa y vigente',
    canEdit: false,
    canDelete: false,
    canSubmit: false
  },
  cancelled: {
    label: 'Cancelada',
    color: 'red',
    description: 'Aplicación cancelada',
    canEdit: false,
    canDelete: false,
    canSubmit: false
  },
  submission_failed: {
    label: 'Error de Envío',
    color: 'red',
    description: 'Error al enviar la aplicación',
    canEdit: true,
    canDelete: true,
    canSubmit: true
  }
}

// ============================================
// CONFIGURACIÓN DE MÉTODOS DE PAGO
// ============================================

export const PAYMENT_METHOD_CONFIG = {
  credit_card: {
    label: 'Tarjeta de Crédito',
    icon: 'credit-card',
    color: 'blue'
  },
  debit_card: {
    label: 'Tarjeta de Débito',
    icon: 'credit-card',
    color: 'green'
  },
  ach: {
    label: 'Transferencia Bancaria',
    icon: 'banknote',
    color: 'purple'
  },
  bank_account: {
    label: 'Cuenta Bancaria',
    icon: 'building-2',
    color: 'orange'
  }
}

// ============================================
// CONFIGURACIÓN DE FRECUENCIAS DE PAGO
// ============================================

export const PAYMENT_FREQUENCY_CONFIG = {
  None: 'Sin frecuencia específica',
  Monthly: 'Mensual',
  SinglePayment: 'Pago único',
  Quarterly: 'Trimestral',
  SemiAnnual: 'Semestral',
  Annual: 'Anual',
  SocialSecurityMonthly: 'Mensual (Seguro Social)'
}

// ============================================
// CONFIGURACIÓN DE TABLAS
// ============================================

export const TABLE_CONFIG = {
  applications: {
    columns: [
      { key: 'carrier_name', label: 'Aseguradora', sortable: true },
      { key: 'status', label: 'Estado', sortable: true },
      { key: 'effective_date', label: 'Fecha Efectiva', sortable: true },
      { key: 'created_at', label: 'Fecha de Creación', sortable: true },
      { key: 'actions', label: 'Acciones', sortable: false }
    ],
    defaultSort: { key: 'created_at', direction: 'desc' as const }
  },
  
  transactions: {
    columns: [
      { key: 'transaction_status', label: 'Estado', sortable: true },
      { key: 'amount', label: 'Monto', sortable: true },
      { key: 'payment_method', label: 'Método', sortable: true },
      { key: 'created_at', label: 'Fecha', sortable: true },
      { key: 'actions', label: 'Acciones', sortable: false }
    ],
    defaultSort: { key: 'created_at', direction: 'desc' as const }
  }
}

// ============================================
// CONFIGURACIÓN DE FORMULARIOS
// ============================================

export const FORM_CONFIG = {
  validation: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Email inválido'
    },
    phone: {
      required: true,
      pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
      message: 'Formato: (123) 456-7890'
    },
    ssn: {
      required: true,
      pattern: /^\d{3}-\d{2}-\d{4}$/,
      message: 'Formato: 123-45-6789'
    },
    zipCode: {
      required: true,
      pattern: /^\d{5}(-\d{4})?$/,
      message: 'Código postal inválido'
    }
  },
  
  fields: {
    firstName: { required: true, maxLength: 50 },
    lastName: { required: true, maxLength: 50 },
    email: { required: true, maxLength: 255 },
    phone: { required: true, maxLength: 20 },
    address1: { required: true, maxLength: 255 },
    city: { required: true, maxLength: 100 },
    state: { required: true, maxLength: 50 },
    zipCode: { required: true, maxLength: 10 }
  }
}

// ============================================
// CONFIGURACIÓN DE RUTAS PROTEGIDAS
// ============================================

export const PROTECTED_ROUTES = [
  '/',
  '/applications',
  '/applications/[id]',
  '/policies',
  '/policies/[id]',
  '/family',
  '/profile',
  '/settings',
  '/support'
]

export const PUBLIC_ROUTES = [
  '/login',
  '/auth/callback'
]

// ============================================
// CONFIGURACIÓN DE ROLES Y PERMISOS
// ============================================

export const ROLE_PERMISSIONS = {
  user: {
    canViewOwnApplications: true,
    canEditOwnApplications: true,
    canDeleteOwnApplications: true,
    canViewOwnTransactions: true,
    canViewOwnProfile: true,
    canEditOwnProfile: true
  },
  
  admin: {
    canViewAllApplications: true,
    canEditAllApplications: true,
    canDeleteAllApplications: true,
    canViewAllTransactions: true,
    canViewAllProfiles: true,
    canEditAllProfiles: true,
    canManageUsers: true,
    canManageRoles: true
  },
  
  support_staff: {
    canViewAllApplications: true,
    canEditAllApplications: false,
    canDeleteAllApplications: false,
    canViewAllTransactions: true,
    canViewAllProfiles: true,
    canEditAllProfiles: false,
    canManageSupportTickets: true
  },
  
  finance_staff: {
    canViewAllApplications: true,
    canEditAllApplications: false,
    canDeleteAllApplications: false,
    canViewAllTransactions: true,
    canViewAllProfiles: false,
    canEditAllProfiles: false,
    canManagePayments: true
  },
  
  agent: {
    canViewAssignedApplications: true,
    canEditAssignedApplications: true,
    canDeleteAssignedApplications: false,
    canViewAssignedTransactions: true,
    canViewAssignedProfiles: true,
    canEditAssignedProfiles: false
  }
}

// ============================================
// CONFIGURACIÓN DE ANALÍTICAS
// ============================================

export const ANALYTICS_CONFIG = {
  // Eventos a trackear
  events: {
    applicationViewed: 'application_viewed',
    applicationCreated: 'application_created',
    applicationSubmitted: 'application_submitted',
    paymentProcessed: 'payment_processed',
    profileUpdated: 'profile_updated',
    loginSuccess: 'login_success',
    logoutSuccess: 'logout_success'
  },
  
  // Propiedades de usuario
  userProperties: {
    userId: 'user_id',
    userEmail: 'user_email',
    userRole: 'user_role',
    applicationsCount: 'applications_count',
    activePoliciesCount: 'active_policies_count'
  }
}

// ============================================
// CONFIGURACIÓN DE ERRORES
// ============================================

export const ERROR_MESSAGES = {
  network: 'Error de conexión. Verifica tu internet.',
  unauthorized: 'No tienes permisos para realizar esta acción.',
  notFound: 'El recurso solicitado no fue encontrado.',
  validation: 'Los datos ingresados no son válidos.',
  server: 'Error interno del servidor. Intenta más tarde.',
  timeout: 'La operación tardó demasiado. Intenta nuevamente.',
  
  // Errores específicos de aplicaciones
  applicationNotFound: 'Aplicación no encontrada.',
  applicationCannotEdit: 'Esta aplicación no puede ser editada.',
  applicationCannotDelete: 'Esta aplicación no puede ser eliminada.',
  
  // Errores específicos de pagos
  paymentFailed: 'El pago no pudo ser procesado.',
  paymentNotFound: 'Transacción de pago no encontrada.',
  
  // Errores específicos de perfil
  profileUpdateFailed: 'No se pudo actualizar el perfil.',
  profileNotFound: 'Perfil de usuario no encontrado.'
}

// ============================================
// CONFIGURACIÓN DE FEATURES FLAGS
// ============================================

export const FEATURE_FLAGS = {
  enableMultiCarrier: true,
  enablePaymentTokenization: false, // Futuro
  enableRealTimeNotifications: true,
  enableAdvancedAnalytics: false,
  enableExportData: true,
  enableBulkActions: false,
  enableAdvancedFilters: true
}

// ============================================
// CONFIGURACIÓN DE DESARROLLO
// ============================================

export const DEV_CONFIG = {
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',
  enablePerformanceMonitoring: process.env.NODE_ENV === 'production',
  
  // URLs de desarrollo
  mockApiUrl: 'http://localhost:3001/api/mock',
  
  // Configuración de logging
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
}
