// Helper functions para comandas divididas

export const PRINTER_DESTINATIONS = {
  KITCHEN: 'kitchen',
  BAR: 'bar', 
  SUSHI_BAR: 'sushi_bar',
  GRILL: 'grill'
}

export const getCategoryPrinterDestination = (categoryName) => {
  const name = categoryName?.toLowerCase() || ''
  
  // Bebidas y relacionadas
  if (name.includes('bebida') || name.includes('drink') || name.includes('cerveza') || 
      name.includes('beer') || name.includes('vino') || name.includes('wine') ||
      name.includes('cocktail') || name.includes('licor') || name.includes('refresco')) {
    return PRINTER_DESTINATIONS.BAR
  }
  
  // Sushi y barra especializada
  if (name.includes('sushi') || name.includes('roll') || name.includes('sashimi') ||
      name.includes('tempura') || name.includes('wasabi') || name.includes('soja')) {
    return PRINTER_DESTINATIONS.SUSHI_BAR
  }
  
  // Parrilla y asados
  if (name.includes('parrilla') || name.includes('grill') || name.includes('asado') ||
      name.includes('carne') || name.includes('steak') || name.includes('brocheta')) {
    return PRINTER_DESTINATIONS.GRILL
  }
  
  // Todo lo demás va a cocina principal
  return PRINTER_DESTINATIONS.KITCHEN
}

export const updateCategoryPrinterDestinations = async (supabase, branchId) => {
  if (!branchId) {
    console.error('No se puede auto-configurar sin branchId')
    return
  }

  try {
    // 1. Obtener todas las categorías y todas las impresoras de la sucursal
    const [categoriesRes, printersRes] = await Promise.all([
      supabase.from('categories').select('id, name, printer_id'),
      supabase.from('printers').select('id, name').eq('branch_id', branchId)
    ])
    
    if (categoriesRes.error) throw categoriesRes.error
    if (printersRes.error) throw printersRes.error
    
    const categories = categoriesRes.data || []
    const printers = printersRes.data || []

    if (printers.length === 0) {
      console.warn('No hay impresoras configuradas para esta sucursal')
      return { error: 'No hay impresoras configuradas. Cree primero las zonas de producción en Configuración.' }
    }

    // 2. Identificar impresoras por palabras clave
    const findPrinter = (keywords) => {
      return printers.find(p => 
        keywords.some(kw => p.name.toLowerCase().includes(kw))
      )
    }

    const printerMap = {
      [PRINTER_DESTINATIONS.BAR]: findPrinter(['bar', 'bebida', 'copa']),
      [PRINTER_DESTINATIONS.SUSHI_BAR]: findPrinter(['sushi', 'barra']),
      [PRINTER_DESTINATIONS.GRILL]: findPrinter(['parrilla', 'grill', 'asador']),
      [PRINTER_DESTINATIONS.KITCHEN]: findPrinter(['cocina', 'caliente', 'produccion']) || printers[0] // Default a la primera
    }

    // 3. Preparar actualizaciones
    const updates = []
    for (const cat of categories) {
      const suggestedArea = getCategoryPrinterDestination(cat.name)
      const targetPrinter = printerMap[suggestedArea]
      
      if (targetPrinter && cat.printer_id !== targetPrinter.id) {
        updates.push({
          id: cat.id,
          printer_id: targetPrinter.id
        })
      }
    }

    // 4. Ejecutar actualizaciones
    if (updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ printer_id: update.printer_id })
          .eq('id', update.id)
      }
      return { success: true, count: updates.length }
    }

    return { success: true, count: 0 }
  } catch (error) {
    console.error('Error auto-configurando categorías:', error)
    return { error: error.message }
  }
}