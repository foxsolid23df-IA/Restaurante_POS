
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymbgtiuixbqyhgigttgs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmd0aXVpeGJxeWhnaWd0dGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMTA2MzgsImV4cCI6MjA4NDg4NjYzOH0.QwdYytB-WalgZ2sBk8NL05bpPOnIJLNMCs3xarl80j4'


const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPrinters() {
  console.log('Checking printers...')
  
  // 1. Check all printers
  const { data: printers, error: printersError } = await supabase
    .from('printers')
    .select('*')
  
  if (printersError) {
    console.error('Error fetching printers:', printersError)
  } else {
    console.log(`Found ${printers.length} total printers in DB:`)
    printers.forEach(p => console.log(`- [${p.id}] ${p.name} (Branch: ${p.branch_id})`))
  }

  // 2. Check branches to see context
  const { data: branches, error: branchesError } = await supabase
    .from('branches')
    .select('*')
    
    if (branchesError) {
        console.error('Error fetching branches:', branchesError)
    } else {
        console.log(`\nFound ${branches.length} branches:`)
        branches.forEach(b => console.log(`- [${b.id}] ${b.name}`))
    }
}

checkPrinters()
