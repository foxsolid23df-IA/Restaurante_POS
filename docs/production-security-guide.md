# Production Hardening for Restaurant POS System

## 1. Security Configuration

### Environment Variables Security
```bash
# Secure environment loading with validation
const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

// Validate at build time
requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
})

// Runtime validation
const validateEnvironment = () => {
  const env = import.meta.env
  
  if (env.VITE_NODE_ENV === 'production') {
    // Security checks for production
    if (env.VITE_ENABLE_DEBUG === 'true') {
      console.warn('⚠️ Debug mode enabled in production')
    }
    
    if (!env.VITE_SUPABASE_URL.startsWith('https://')) {
      throw new Error('Insecure protocol detected for Supabase URL')
    }
  }
}
```

### Content Security Policy (CSP)
```javascript
// src/security/csp.js
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'font-src': ["'self'", "https:"],
  'connect-src': [
    "'self'", 
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_API_URL
  ]
}

export const applyCSP = () => {
  const cspHeader = Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
    
  document.meta?.setAttribute('http-equiv', 'Content-Security-Policy')
  document.meta?.setAttribute('content', cspHeader)
}
```

## 2. Database Security

### Row Level Security (RLS) Policies
```sql
-- Enhanced RLS for orders table
CREATE POLICY "Users can manage their own orders" ON orders
    FOR ALL
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.restaurant_id = orders.restaurant_id
            AND up.role IN ('admin', 'manager')
        )
    );

-- Prevent data leakage
CREATE POLICY "Restaurant-specific data access" ON products
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_restaurants ur
            WHERE ur.user_id = auth.uid()
            AND ur.restaurant_id = products.restaurant_id
        )
    );
```

### Input Validation and Sanitization
```javascript
// src/security/inputValidation.js
import DOMPurify from 'dompurify'

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  })
}

export const validateOrderItem = (item) => {
  const errors = []
  
  if (!item.productId || typeof item.productId !== 'string') {
    errors.push('Product ID is required')
  }
  
  if (!item.quantity || item.quantity <= 0) {
    errors.push('Quantity must be greater than 0')
  }
  
  if (item.quantity > 100) {
    errors.push('Quantity exceeds maximum limit')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

## 3. Authentication Security

### Session Management
```javascript
// src/auth/sessionManager.js
const MAX_SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours

export const createSecureSession = async (user) => {
  const session = {
    userId: user.id,
    role: user.role,
    loginTime: Date.now(),
    lastActivity: Date.now(),
    sessionId: crypto.randomUUID()
  }
  
  // Store in sessionStorage with encryption
  sessionStorage.setItem('pos_session', encryptSession(session))
  
  return session
}

export const validateSession = () => {
  const session = getCurrentSession()
  
  if (!session) return false
  
  const now = Date.now()
  const sessionAge = now - session.loginTime
  const inactivityTime = now - session.lastActivity
  
  return (
    sessionAge < MAX_SESSION_DURATION &&
    inactivityTime < 30 * 60 * 1000 // 30 minutes max inactivity
  )
}

export const logout = () => {
  sessionStorage.removeItem('pos_session')
  localStorage.removeItem('pos_remember')
  window.location.href = '/login'
}
```

## 4. API Security

### Rate Limiting
```javascript
// src/security/rateLimiter.js
const rateLimitStore = new Map()

export const rateLimit = (key, limit, windowMs) => {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Clean old entries
  for (const [k, requests] of rateLimitStore.entries()) {
    if (k.startsWith(key)) {
      const validRequests = requests.filter(time => time > windowStart)
      if (validRequests.length === 0) {
        rateLimitStore.delete(k)
      } else {
        rateLimitStore.set(k, validRequests)
      }
    }
  }
  
  const currentRequests = rateLimitStore.get(key) || []
  
  if (currentRequests.length >= limit) {
    throw new Error('Rate limit exceeded')
  }
  
  rateLimitStore.set(key, [...currentRequests, now])
}

export const apiRateLimit = (endpoint) => {
  return rateLimit(`api:${endpoint}`, 100, 60 * 1000) // 100 requests per minute
}
```

### Request Validation Middleware
```javascript
// src/security/requestValidation.js
export const validateRequest = (req) => {
  // Check content type
  if (req.method !== 'GET' && !req.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Invalid content type')
  }
  
  // Check request size
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    throw new Error('Request too large')
  }
  
  // Validate origin in production
  if (import.meta.env.PROD) {
    const origin = req.headers.get('origin')
    const allowedOrigins = [
      import.meta.env.VITE_FRONTEND_URL,
      'https://pos.yourdomain.com'
    ]
    
    if (origin && !allowedOrigins.includes(origin)) {
      throw new Error('Invalid origin')
    }
  }
}
```

## 5. Client-Side Security

### XSS Prevention
```javascript
// src/security/xssProtection.js
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  
  return text.replace(/[&<>"']/g, m => map[m])
}

export const validateComponentProps = (props) => {
  const sanitizedProps = {}
  
  Object.keys(props).forEach(key => {
    if (typeof props[key] === 'string') {
      sanitizedProps[key] = escapeHtml(props[key])
    } else if (Array.isArray(props[key])) {
      sanitizedProps[key] = props[key].map(item => 
        typeof item === 'string' ? escapeHtml(item) : item
      )
    } else {
      sanitizedProps[key] = props[key]
    }
  })
  
  return sanitizedProps
}
```

## 6. Performance Optimization

### Resource Optimization
```javascript
// src/performance/optimizer.js
export const preloadCriticalResources = () => {
  // Preload critical chunks
  const criticalChunks = [
    '/assets/js/vendor-react.js',
    '/assets/js/features-pos.js',
    '/assets/css/main.css'
  ]
  
  criticalChunks.forEach(chunk => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = chunk
    link.as = chunk.endsWith('.css') ? 'style' : 'script'
    document.head.appendChild(link)
  })
}

export const optimizeImages = () => {
  const images = document.querySelectorAll('img[data-src]')
  
  images.forEach(img => {
    // Lazy loading with intersection observer
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = img.dataset.src
          observer.unobserve(img)
        }
      })
    })
    
    observer.observe(img)
  })
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
```

## 7. Error Handling and Logging

### Production Error Handling
```javascript
// src/error/errorHandler.js
export const errorHandler = (error, errorInfo) => {
  // Don't log errors in development console
  if (import.meta.env.PROD) {
    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      })
    }
    
    // Log to custom endpoint
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(() => {
      // Silent fail for error reporting
    })
  }
}

export class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    errorHandler(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Algo salió mal
            </h1>
            <p className="text-gray-600 mb-6">
              Nuestro equipo ha sido notificado del problema.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

## 8. Monitoring and Alerts

### Performance Monitoring
```javascript
// src/monitoring/performance.js
export const initializeMonitoring = () => {
  // Core Web Vitals
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          reportMetric('LCP', entry.startTime)
        } else if (entry.entryType === 'first-input') {
          reportMetric('FID', entry.processingStart - entry.startTime)
        }
      })
    })
    
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] })
  }
  
  // Memory usage
  if ('memory' in performance) {
    setInterval(() => {
      const memory = performance.memory
      if (memory.usedJSHeapSize > memory.totalJSHeapSize * 0.9) {
        reportMetric('MEMORY_WARNING', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize
        })
      }
    }, 30000) // Check every 30 seconds
  }
}

const reportMetric = (name, value) => {
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING) {
    fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        value,
        timestamp: Date.now(),
        url: window.location.href
      })
    })
  }
}
```