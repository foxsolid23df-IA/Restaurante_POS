# Security Configuration for Restaurant POS Production
# This file contains security policies and hardening configurations

# Content Security Policy (CSP)
# Restricts which resources can be loaded and executed
module.exports = {
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'",  // Required for React development, remove in production
        "https://*.supabase.co"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",  // Required for Tailwind CSS
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "blob:", 
        "https://*.supabase.co",
        "https://images.unsplash.com"  // For product images
      ],
      fontSrc: [
        "'self'", 
        "data:", 
        "https://fonts.gstatic.com"
      ],
      connectSrc: [
        "'self'", 
        "https://*.supabase.co", 
        "wss://*.supabase.co",
        "https://api.stripe.com",  // Payment processing
        "https://api.mercadopago.com"  // Alternative payment processor
      ],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"]
    },
    reportUri: '/api/csp-report'
  }
}

# Security Headers Configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',  // Prevent clickjacking
  'X-Content-Type-Options': 'nosniff',  // Prevent MIME type sniffing
  'X-XSS-Protection': '1; mode=block',  // Browser XSS protection
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',  // Disable sensitive APIs
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',  // HSTS
  'Content-Security-Policy': cspPolicy,
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' ? 'https://your-restaurant.com' : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true'
}

# Rate Limiting Configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
  
  // Specific rate limits for sensitive endpoints
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // Only 5 login attempts per 15 minutes
    skipSuccessfulRequests: true
  },
  
  orders: {
    windowMs: 60 * 1000,  // 1 minute
    max: 30,  // Max 30 orders per minute per IP
    skipSuccessfulRequests: false
  },
  
  payments: {
    windowMs: 60 * 1000,  // 1 minute
    max: 10,  // Max 10 payment attempts per minute
    skipSuccessfulRequests: false
  }
}

# Input Validation and Sanitization
const inputValidation = {
  // SQL Injection Prevention
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input
    
    return input
      .replace(/[\0\x08\x09\x1a\n\r"'\'\\]/g, '')  // Remove dangerous characters
      .replace(/(?:%[0-9A-Fa-f]{2})+/g, '')  // Remove URL encoding
      .trim()
  },
  
  // XSS Prevention
  escapeHtml: (text) => {
    if (typeof text !== 'string') return text
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    
    return text.replace(/[&<>"']/g, m => map[m])
  },
  
  // Validate common inputs
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  validatePhone: (phone) => {
    const phoneRegex = /^\+?[\d\s-()]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  },
  
  validateCurrency: (amount) => {
    const num = parseFloat(amount)
    return !isNaN(num) && num >= 0 && num <= 999999.99
  },
  
  validateOrderId: (orderId) => {
    const orderIdRegex = /^ORD_[a-zA-Z0-9]{16}$/
    return orderIdRegex.test(orderId)
  }
}

# Database Security Configuration
const dbSecurity = {
  // Row Level Security Policies
  rlsPolicies: {
    // Users can only see/edit their own orders
    orders: `
      CREATE POLICY "Users can view own orders" ON orders
      FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert own orders" ON orders
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update own orders" ON orders
      FOR UPDATE USING (auth.uid() = user_id);
    `,
    
    // Staff can manage tables but customers cannot
    tables: `
      CREATE POLICY "Staff can view all tables" ON tables
      FOR SELECT USING (auth.jwt() ->> 'role' in ('admin', 'manager', 'staff'));
      
      CREATE POLICY "Staff can manage tables" ON tables
      FOR ALL USING (auth.jwt() ->> 'role' in ('admin', 'manager', 'staff'));
    `,
    
    // Inventory access restrictions
    inventory: `
      CREATE POLICY "Staff can view inventory" ON inventory_items
      FOR SELECT USING (auth.jwt() ->> 'role' in ('admin', 'manager', 'staff'));
      
      CREATE POLICY "Managers can manage inventory" ON inventory_items
      FOR ALL USING (auth.jwt() ->> 'role' in ('admin', 'manager'));
    `
  },
  
  // Database security functions
  securityFunctions: `
    -- Function to log all data changes
    CREATE OR REPLACE FUNCTION audit_trigger()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO audit_log (
        table_name, 
        operation, 
        user_id, 
        old_data, 
        new_data, 
        timestamp
      ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        row_to_json(OLD),
        row_to_json(NEW),
        NOW()
      );
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Prevent direct table access without proper authorization
    CREATE OR REPLACE FUNCTION check_user_role()
    RETURNS TRIGGER AS $$
    BEGIN
      IF auth.jwt() ->> 'role' NOT IN ('admin', 'manager', 'staff', 'customer') THEN
        RAISE EXCEPTION 'Unauthorized role';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `
}

# Encryption Configuration
const encryption = {
  // Environment variable encryption
  encryptEnv: (value) => {
    const crypto = require('crypto')
    const algorithm = 'aes-256-gcm'
    const secretKey = process.env.ENCRYPTION_KEY
    
    if (!secretKey) {
      throw new Error('ENCRYPTION_KEY environment variable not set')
    }
    
    const key = crypto.scryptSync(secretKey, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(algorithm, key, iv)
    
    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  },
  
  // Session encryption
  sessionConfig: {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,  // 24 hours
      sameSite: 'strict'
    }
  }
}

# API Security Configuration
const apiSecurity = {
  // Authentication middleware
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = decoded
      next()
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
  },
  
  // Role-based access control
  authorize: (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }
      
      next()
    }
  },
  
  // Request validation
  validateRequest: (schema) => {
    return (req, res, next) => {
      const { error } = schema.validate(req.body)
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        })
      }
      next()
    }
  }
}

module.exports = {
  securityHeaders,
  rateLimitConfig,
  inputValidation,
  dbSecurity,
  encryption,
  apiSecurity
}