import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

async function invokeAdminService(body) {
  const headers = {}
  const profile = useAuthStore.getState().profile

  if (profile?.id) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      headers['X-Profile-Id'] = profile.id
    }
  }

  const { data, error } = await supabase.functions.invoke('admin-service', { body, headers })
  if (error) throw new Error(error.message || 'No se pudo ejecutar admin-service')
  if (data?.error) throw new Error(data.error)
  return data
}

export const licenseApi = {
  async getLicenses() {
    return invokeAdminService({ action: 'list_subscriptions' })
  },

  async createLicense({ full_name, email, password }) {
    return invokeAdminService({
      action: 'create_license_user',
      userData: { full_name, email, password }
    })
  },

  async suspendSubscription(subscriptionId) {
    return invokeAdminService({ action: 'suspend_subscription', subscriptionId })
  },

  async reactivateSubscription(subscriptionId) {
    return invokeAdminService({ action: 'reactivate_subscription', subscriptionId })
  },

  async updateSubscription(subscriptionId, updates) {
    return invokeAdminService({
      action: 'update_subscription',
      subscriptionId,
      updates
    })
  }
}
