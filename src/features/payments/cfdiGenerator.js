const CFDI_VERSION = '4.0'
const SAT_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/

function validateRFC(rfc) {
  return /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)
}

function sanitizeXML(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function buildCFDI({
  emitter: { rfc: emitterRFC, name: emitterName, taxRegime = '601' },
  receiver: { rfc: receiverRFC, name: receiverName, taxResidence, taxRegime = '608' },
  items,
  paymentForm = '01',
  paymentMethod = 'PUE',
  currency = 'MXN',
  exchangeRate = 1,
  serie = 'A',
  folio = 1,
  certificateNumber = '00000000000000000000',
  fiscalFolio,
}) {
  if (!validateRFC(emitterRFC)) throw new Error('RFC del emisor inválido')
  if (!validateRFC(receiverRFC)) throw new Error('RFC del receptor inválido')

  const now = new Date()
  const dateStr = now.toISOString().replace(/\.\d{3}Z/, '')

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const totalTaxes = items.reduce((sum, item) => {
    const taxRate = item.taxRate || 0.16
    return sum + (item.quantity * item.unitPrice * taxRate)
  }, 0)
  const total = subtotal + totalTaxes

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`
  xml += `<cfdi:Comprobante`
  xml += ` xmlns:cfdi="http://www.sat.gob.mx/cfd/4"`
  xml += ` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`
  xml += ` xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd"`
  xml += ` Version="${CFDI_VERSION}"`
  xml += ` Serie="${sanitizeXML(serie)}"`
  xml += ` Folio="${folio}"`
  xml += ` Fecha="${dateStr}"`
  xml += ` FormaPago="${paymentForm}"`
  xml += ` MetodoPago="${paymentMethod}"`
  xml += ` Moneda="${currency}"`
  xml += ` TipoCambio="${exchangeRate !== 1 ? exchangeRate : ''}"`
  xml += ` SubTotal="${subtotal.toFixed(2)}"`
  xml += ` Total="${total.toFixed(2)}"`
  xml += ` TipoDeComprobante="I"`
  xml += ` Exportacion="01"`
  xml += ` LugarExpedicion="${fiscalFolio?.place || '00000'}"`
  xml += `>`

  xml += `<cfdi:Emisor Rfc="${sanitizeXML(emitterRFC)}" Nombre="${sanitizeXML(emitterName)}" RegimenFiscal="${taxRegime}"/>`

  xml += `<cfdi:Receptor Rfc="${sanitizeXML(receiverRFC)}" Nombre="${sanitizeXML(receiverName)}"`
  xml += ` DomicilioFiscalReceptor="${fiscalFolio?.zip || '00000'}"`
  xml += ` RegimenFiscalReceptor="${taxRegime}"`
  if (taxResidence) xml += ` ResidenciaFiscal="${sanitizeXML(taxResidence)}"`
  xml += ` UsoCFDI="${fiscalFolio?.cfdiUsage || 'G01'}"`
  xml += `/>`

  xml += `<cfdi:Conceptos>`
  items.forEach((item) => {
    const importe = item.quantity * item.unitPrice
    const taxRate = item.taxRate || 0.16
    const taxAmount = importe * taxRate
    const totalAmount = importe + taxAmount

    xml += `<cfdi:Concepto ClaveProdServ="${item.satCode || '01010101'}" NoIdentificacion="${sanitizeXML(item.sku || '')}" Cantidad="${item.quantity}" ClaveUnidad="${item.unitCode || 'H87'}" Unidad="${sanitizeXML(item.unit || 'Pieza')}" Descripcion="${sanitizeXML(item.description)}" ValorUnitario="${item.unitPrice.toFixed(2)}" Importe="${importe.toFixed(2)}" ObjetoImp="02">`
    xml += `<cfdi:Impuestos>`
    xml += `<cfdi:Traslados>`
    xml += `<cfdi:Traslado Base="${importe.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="${taxRate}" Importe="${taxAmount.toFixed(2)}"/>`
    xml += `</cfdi:Traslados>`
    xml += `</cfdi:Impuestos>`
    xml += `</cfdi:Concepto>`
  })
  xml += `</cfdi:Conceptos>`

  xml += `<cfdi:Impuestos TotalImpuestosTrasladados="${totalTaxes.toFixed(2)}">`
  xml += `<cfdi:Traslados>`
  xml += `<cfdi:Traslado Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${totalTaxes.toFixed(2)}"/>`
  xml += `</cfdi:Traslados>`
  xml += `</cfdi:Impuestos>`

  if (certificateNumber) {
    xml += `<cfdi:Complemento>`
    xml += `<tfd:TimbreFiscalDigital`
    xml += ` xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"`
    xml += ` xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd"`
    xml += ` Version="1.1"`
    xml += ` UUID="${fiscalFolio?.uuid || '00000000-0000-0000-0000-000000000000'}"`
    xml += ` FechaTimbrado="${dateStr}"`
    xml += ` RfcProvCertif="${certificateNumber}"`
    xml += ` SelloCFD="..."`
    xml += ` NoCertificadoSAT="00001000000000000000"`
    xml += ` SelloSAT="..."/>`
    xml += `</cfdi:Complemento>`
  }

  xml += `</cfdi:Comprobante>`

  return xml
}

export function parseCFDISummary(xmlString) {
  try {
    const getTag = (tag) => {
      const match = xmlString.match(new RegExp(`<cfdi:${tag}[^>]*`))
      if (!match) return null
      const attrs = {}
      const attrRegex = /(\w+)="([^"]*)"/g
      let m
      while ((m = attrRegex.exec(match[0])) !== null) {
        attrs[m[1]] = m[2]
      }
      return attrs
    }

    const comprobante = getTag('Comprobante')
    const emisor = getTag('Emisor')
    const receptor = getTag('Receptor')

    return {
      folio: comprobante?.Folio,
      serie: comprobante?.Serie,
      date: comprobante?.Fecha,
      subtotal: parseFloat(comprobante?.SubTotal || 0),
      total: parseFloat(comprobante?.Total || 0),
      currency: comprobante?.Moneda,
      emitter: { rfc: emisor?.Rfc, name: emisor?.Nombre },
      receiver: { rfc: receptor?.Rfc, name: receptor?.Nombre },
    }
  } catch {
    return null
  }
}

export async function generateInvoice(orderData, fiscalConfig) {
  const items = (orderData.items || []).map((item) => ({
    description: item.name || item.description,
    quantity: item.quantity || 1,
    unitPrice: item.unit_price || item.price || 0,
    taxRate: fiscalConfig.taxRate || 0.16,
    satCode: item.satCode,
    sku: item.sku,
    unit: item.unit,
  }))

  const cfdiXml = buildCFDI({
    emitter: {
      rfc: fiscalConfig.emitterRFC,
      name: fiscalConfig.emitterName,
      taxRegime: fiscalConfig.taxRegime || '601',
    },
    receiver: {
      rfc: fiscalConfig.receiverRFC,
      name: fiscalConfig.receiverName,
      taxRegime: fiscalConfig.receiverTaxRegime || '608',
    },
    items,
    currency: orderData.currency || 'MXN',
    paymentForm: orderData.paymentForm || '01',
    paymentMethod: orderData.paymentMethod || 'PUE',
    serie: orderData.serie || fiscalConfig.serie || 'A',
    folio: orderData.folio || 1,
    certificateNumber: fiscalConfig.certificateNumber,
    fiscalFolio: {
      place: fiscalConfig.zip,
      zip: fiscalConfig.zip,
      uuid: orderData.uuid,
      cfdiUsage: orderData.cfdiUsage || 'G01',
    },
  })

  return {
    xml: cfdiXml,
    summary: parseCFDISummary(cfdiXml),
    total: items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 + (item.taxRate || 0.16)), 0),
  }
}
