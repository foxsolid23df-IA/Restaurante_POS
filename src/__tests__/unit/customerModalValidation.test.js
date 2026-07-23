import { describe, it, expect } from 'vitest'

function validateCustomerForm(data) {
  const errors = {}

  if (!data.name?.trim()) {
    errors.name = 'El nombre es obligatorio'
  } else if (data.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres'
  }

  if (data.phone && !/^[\d\s\-+()]{7,15}$/.test(data.phone)) {
    errors.phone = 'Formato de teléfono inválido'
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Formato de correo inválido'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

describe('CustomerModal Validation - Unit', () => {
  describe('name field', () => {
    it('should require name', () => {
      const result = validateCustomerForm({ name: '', email: '', phone: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBe('El nombre es obligatorio')
    })

    it('should require name when only whitespace', () => {
      const result = validateCustomerForm({ name: '   ', email: '', phone: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBe('El nombre es obligatorio')
    })

    it('should require name when undefined', () => {
      const result = validateCustomerForm({ email: '', phone: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBe('El nombre es obligatorio')
    })

    it('should reject name shorter than 2 characters', () => {
      const result = validateCustomerForm({ name: 'A', email: '', phone: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBe('El nombre debe tener al menos 2 caracteres')
    })

    it('should accept valid name', () => {
      const result = validateCustomerForm({ name: 'Juan Perez', email: '', phone: '' })
      expect(result.valid).toBe(true)
      expect(result.errors.name).toBeUndefined()
    })

    it('should accept name with exactly 2 characters', () => {
      const result = validateCustomerForm({ name: 'AB', email: '', phone: '' })
      expect(result.valid).toBe(true)
    })
  })

  describe('phone field', () => {
    it('should accept empty phone', () => {
      const result = validateCustomerForm({ name: 'Juan', phone: '', email: '' })
      expect(result.valid).toBe(true)
      expect(result.errors.phone).toBeUndefined()
    })

    it('should accept valid phone with digits only', () => {
      const result = validateCustomerForm({ name: 'Juan', phone: '5512345678', email: '' })
      expect(result.valid).toBe(true)
    })

    it('should accept phone with spaces and dashes', () => {
      const result = validateCustomerForm({ name: 'Juan', phone: '55-1234-5678', email: '' })
      expect(result.valid).toBe(true)
    })

    it('should accept phone with plus prefix', () => {
      const result = validateCustomerForm({ name: 'Juan', phone: '+525512345678', email: '' })
      expect(result.valid).toBe(true)
    })

    it('should accept phone with parentheses', () => {
      const result = validateCustomerForm({ name: 'Juan', phone: '(55) 1234-5678', email: '' })
      expect(result.valid).toBe(true)
    })

    it('should reject phone shorter than 7 digits', () => {
      const result = validateCustomerForm({ name: 'Juan', phone: '12345', email: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.phone).toBe('Formato de teléfono inválido')
    })

    it('should reject phone with invalid characters', () => {
      const result = validateCustomerForm({ name: 'Juan', phone: 'abc123456', email: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.phone).toBe('Formato de teléfono inválido')
    })
  })

  describe('email field', () => {
    it('should accept empty email', () => {
      const result = validateCustomerForm({ name: 'Juan', email: '', phone: '' })
      expect(result.valid).toBe(true)
      expect(result.errors.email).toBeUndefined()
    })

    it('should accept valid email', () => {
      const result = validateCustomerForm({ name: 'Juan', email: 'test@example.com', phone: '' })
      expect(result.valid).toBe(true)
    })

    it('should accept email with subdomains', () => {
      const result = validateCustomerForm({ name: 'Juan', email: 'user@mail.example.com', phone: '' })
      expect(result.valid).toBe(true)
    })

    it('should reject email without @', () => {
      const result = validateCustomerForm({ name: 'Juan', email: 'invalid.com', phone: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBe('Formato de correo inválido')
    })

    it('should reject email without domain', () => {
      const result = validateCustomerForm({ name: 'Juan', email: 'user@', phone: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBe('Formato de correo inválido')
    })

    it('should reject email without TLD', () => {
      const result = validateCustomerForm({ name: 'Juan', email: 'user@domain', phone: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBe('Formato de correo inválido')
    })

    it('should reject email with spaces', () => {
      const result = validateCustomerForm({ name: 'Juan', email: 'user @example.com', phone: '' })
      expect(result.valid).toBe(false)
      expect(result.errors.email).toBe('Formato de correo inválido')
    })
  })

  describe('combined validation', () => {
    it('should return multiple errors when all fields invalid', () => {
      const result = validateCustomerForm({ name: '', email: 'bad', phone: '12' })
      expect(result.valid).toBe(false)
      expect(result.errors.name).toBeTruthy()
      expect(result.errors.phone).toBeTruthy()
      expect(result.errors.email).toBeTruthy()
    })

    it('should pass with all valid fields', () => {
      const result = validateCustomerForm({
        name: 'Maria Lopez',
        email: 'maria@test.com',
        phone: '5512345678',
      })
      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('should pass with valid name only (optional fields empty)', () => {
      const result = validateCustomerForm({ name: 'Pedro', email: '', phone: '' })
      expect(result.valid).toBe(true)
    })
  })
})
