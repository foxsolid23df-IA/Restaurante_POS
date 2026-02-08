import { supabase } from '@/lib/supabase'

export const commonApi = {
    getBusinessSettings: async () => {
        const { data, error } = await supabase
            .from('business_settings')
            .select('*')
            .single()
        if (error && error.code !== 'PGRST116') throw error
        return data
    }
}
