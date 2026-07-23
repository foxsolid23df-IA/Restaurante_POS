const cspPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "worker-src 'self' blob:",
].join('; ')

export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': cspPolicy,
}

export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
  },
  orders: {
    windowMs: 60 * 1000,
    max: 30,
    skipSuccessfulRequests: false,
  },
  payments: {
    windowMs: 60 * 1000,
    max: 10,
    skipSuccessfulRequests: false,
  },
}

export const inputValidation = {
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input
    return input
      .replace(/[\0\x08\x09\x1a\n\r"'\\]/g, '')
      .replace(/(?:%[0-9A-Fa-f]{2})+/g, '')
      .trim()
  },
  escapeHtml: (text) => {
    if (typeof text !== 'string') return text
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
    return text.replace(/[&<>"']/g, m => map[m])
  },
  validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  validatePhone: (phone) => /^\+?[\d\s-()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10,
  validateCurrency: (amount) => {
    const num = parseFloat(amount)
    return !isNaN(num) && num >= 0 && num <= 999999.99
  },
  validateOrderId: (orderId) => /^ORD_[a-zA-Z0-9]{16}$/.test(orderId),
}

export const apiSecurity = {
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Access token required' })
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
      req.user = decoded
      next()
    } catch {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
  },
  authorize: (roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' })
    next()
  },
}
