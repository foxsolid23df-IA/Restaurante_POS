import { describe, it, expect } from 'vitest'

function getFrequencyLabel(visitCount) {
  const visits = visitCount || 0
  if (visits <= 1) return 'Nunca'
  if (visits <= 3) return 'Raro'
  if (visits <= 6) return 'Ocasional'
  if (visits <= 12) return 'Regular'
  return 'Frecuente'
}

describe('ClientDirectory Frequency - Unit', () => {
  describe('getFrequencyLabel', () => {
    it('should return "Nunca" for 0 visits', () => {
      expect(getFrequencyLabel(0)).toBe('Nunca')
    })

    it('should return "Nunca" for 1 visit', () => {
      expect(getFrequencyLabel(1)).toBe('Nunca')
    })

    it('should return "Nunca" when visitCount is null', () => {
      expect(getFrequencyLabel(null)).toBe('Nunca')
    })

    it('should return "Nunca" when visitCount is undefined', () => {
      expect(getFrequencyLabel(undefined)).toBe('Nunca')
    })

    it('should return "Raro" for 2 visits', () => {
      expect(getFrequencyLabel(2)).toBe('Raro')
    })

    it('should return "Raro" for 3 visits', () => {
      expect(getFrequencyLabel(3)).toBe('Raro')
    })

    it('should return "Ocasional" for 4 visits', () => {
      expect(getFrequencyLabel(4)).toBe('Ocasional')
    })

    it('should return "Ocasional" for 5 visits', () => {
      expect(getFrequencyLabel(5)).toBe('Ocasional')
    })

    it('should return "Ocasional" for 6 visits', () => {
      expect(getFrequencyLabel(6)).toBe('Ocasional')
    })

    it('should return "Regular" for 7 visits', () => {
      expect(getFrequencyLabel(7)).toBe('Regular')
    })

    it('should return "Regular" for 10 visits', () => {
      expect(getFrequencyLabel(10)).toBe('Regular')
    })

    it('should return "Regular" for 12 visits', () => {
      expect(getFrequencyLabel(12)).toBe('Regular')
    })

    it('should return "Frecuente" for 13 visits', () => {
      expect(getFrequencyLabel(13)).toBe('Frecuente')
    })

    it('should return "Frecuente" for 20 visits', () => {
      expect(getFrequencyLabel(20)).toBe('Frecuente')
    })

    it('should return "Frecuente" for 100 visits', () => {
      expect(getFrequencyLabel(100)).toBe('Frecuente')
    })
  })

  describe('boundary values', () => {
    const expected = [
      [0, 'Nunca'],
      [1, 'Nunca'],
      [2, 'Raro'],
      [3, 'Raro'],
      [4, 'Ocasional'],
      [6, 'Ocasional'],
      [7, 'Regular'],
      [12, 'Regular'],
      [13, 'Frecuente'],
    ]

    it.each(expected)('visits=%i → "%s"', (visits, expectedLabel) => {
      expect(getFrequencyLabel(visits)).toBe(expectedLabel)
    })
  })
})
