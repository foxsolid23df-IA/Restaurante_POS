import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export const generatePurchaseOrderPDF = (forecastData, totalCost) => {
  const doc = jsPDF()
  const today = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Estilos de marca
  const primaryColor = [37, 99, 235] // Blue-600

  // Encabezado
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDEN DE COMPRA sugerida', 15, 25)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado el: ${today}`, 150, 25)

  // Información del Establecimiento (Placeholder - puede ser dinámico luego)
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Restaurante POS - Sistema de Inteligencia', 15, 55)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Resumen de requerimientos para la próxima semana (7 días)', 15, 62)
  doc.text('Basado en el consumo promedio de los últimos 30 días.', 15, 67)

  // Filtrar solo items que hay que comprar
  const itemsToBuy = forecastData.filter(item => item.toBuy > 0)

  // Tabla de Productos
  const tableRows = itemsToBuy.map(item => [
    item.name,
    `${item.currentStock.toFixed(2)} ${item.unit}`,
    `${item.toBuy.toFixed(2)} ${item.unit}`,
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.costPerUnit),
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.estimatedCost)
  ])

  doc.autoTable({
    startY: 80,
    head: [['Ingrediente', 'Stock Actual', 'Cantidad a Comprar', 'Costo Unit.', 'Total Est.']],
    body: tableRows,
    headStyles: { 
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'center', textColor: [22, 101, 52] }, // Emerald-800
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    }
  })

  // Resumen Final
  const finalY = doc.lastAutoTable.finalY + 15
  
  doc.setFillColor(248, 250, 252)
  doc.rect(130, finalY, 65, 25, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Inversión Total Estimada:', 135, finalY + 10)
  
  doc.setFontSize(14)
  doc.setTextColor(37, 99, 235)
  doc.setFont('helvetica', 'bold')
  doc.text(new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalCost), 135, finalY + 20)

  // Notas de urgencia
  const urgentItems = itemsToBuy.filter(i => i.isUrgent).length
  if (urgentItems > 0) {
    doc.setTextColor(220, 38, 38)
    doc.setFontSize(9)
    doc.text(`* Atención: ${urgentItems} ingredientes se encuentran actualmente por debajo del stock mínimo.`, 15, finalY + 10)
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' })
  }

  // Guardar PDF
  doc.save(`Orden_Compra_${new Date().toISOString().split('T')[0]}.pdf`)
}
