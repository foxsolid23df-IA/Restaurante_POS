import { useSuspenseQuery } from '@tanstack/react-query'
import { commonApi } from '../api/commonApi'

export const useBusinessSettings = () => {
    return useSuspenseQuery({
        queryKey: ['businessSettings'],
        queryFn: commonApi.getBusinessSettings,
        staleTime: Infinity // Settings rarely change
    })
}
