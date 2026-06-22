import { settingsApi } from '@/features/settings/api/settingsApi'

export const commonApi = {
    getBusinessSettings: async () => {
        return settingsApi.getBusinessSettings()
    }
}
