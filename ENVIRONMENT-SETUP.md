# 🔧 Configuración de Variables de Entorno - Dashboard

## 📋 Variables Requeridas

Para que el dashboard funcione correctamente, necesitas crear un archivo `.env.local` en la raíz del proyecto `epicare-dashboard/` con las siguientes variables:

```bash
# ============================================
# CONFIGURACIÓN DE SUPABASE
# ============================================
# IMPORTANTE: Estas deben ser las MISMAS credenciales que usa el marketplace
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ============================================
# URLs DE LAS APLICACIONES
# ============================================
NEXT_PUBLIC_MARKETPLACE_URL=http://localhost:3000
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3001

# ============================================
# CONFIGURACIÓN DE DESARROLLO
# ============================================
# Opcional: Habilitar datos mock para testing
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

## 🚀 Instrucciones de Configuración

### 1. Obtener Credenciales de Supabase
- Ve al proyecto de Supabase del marketplace
- Copia la URL y la clave anónima
- **IMPORTANTE**: Usa las mismas credenciales en ambos proyectos

### 2. Configurar URLs
- **Desarrollo**: usar localhost con puertos diferentes
- **Producción**: usar los dominios reales (epicare.com y dashboard.epicare.com)

### 3. Crear el Archivo
```bash
cd epicare-dashboard/
# Crear .env.local con las variables de arriba
# Editar con las credenciales reales
```

## ⚠️ Notas Importantes

- **Las credenciales de Supabase DEBEN ser las mismas en ambos proyectos**
- Esto permite que las cookies de autenticación se compartan entre dominios
- En producción, las cookies se configurarán con domain `.epicare.com`
- En desarrollo local, cada app manejará su sesión independientemente (comportamiento normal)

## 🧪 Testing

### Desarrollo Local
1. Configurar variables de entorno
2. Iniciar marketplace: `npm run dev` (puerto 3000)
3. Iniciar dashboard: `npm run dev` (puerto 3001)
4. Login en marketplace
5. Navegar a dashboard (sesión independiente en dev)

### Producción
1. Login en epicare.com
2. Navegar a dashboard.epicare.com
3. Verificar que sesión esté activa automáticamente
4. Verificar cookies en DevTools con domain `.epicare.com`

## 🔍 Troubleshooting

### Error: "Usuario no autenticado en dashboard"
- Verificar que ambos proyectos usen las mismas credenciales de Supabase
- Verificar que el domain de cookies esté configurado correctamente
- Limpiar cookies del navegador y volver a intentar

### Error: "Cookies no se comparten"
- Asegurarse que ambos dominios estén bajo el mismo dominio padre (epicare.com)
- Verificar en DevTools que las cookies tengan domain `.epicare.com`
- En producción, verificar que SSL esté configurado correctamente

### Error: "No se pueden cargar aplicaciones"
- Verificar que las credenciales de Supabase sean correctas
- Verificar que RLS (Row Level Security) esté configurado en Supabase
- Verificar que el usuario tenga aplicaciones en la base de datos