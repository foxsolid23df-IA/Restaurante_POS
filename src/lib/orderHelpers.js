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

export const updateCategoryPrinterDestinations = async (supabase) => {
  try {
    // Obtener todas las categorías sin printer_destination
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, printer_destination')
      .is('printer_destination', null)
    
    if (error) throw error
    
    if (categories && categories.length > 0) {
      // Actualizar cada categoría con su destino correspondiente
      const updates = categories.map(category => ({
        id: category.id,
        printer_destination: getCategoryPrinterDestination(category.name)
      }))
      
      // Ejecutar actualizaciones en batch
      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ printer_destination: update.printer_destination })
          .eq('id', update.id)
      }
      
      console.log(`Actualizadas ${updates.length} categorías con printer_destination`)
    }
  } catch (error) {
    console.error('Error actualizando printer_destinations:', error)
  }
}