import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '../api/authApi'
import { useCallback } from 'react'

export const useAuth = () => {
    const queryClient = useQueryClient()
    const setProfile = useAuthStore(state => state.updateProfile)
    const setUser = (user) => useAuthStore.setState({ user })
    const setLoading = (loading) => useAuthStore.setState({ loading })

    const loginMutation = useMutation({
        mutationFn: ({ email, password }) => authApi.signInWithPassword(email, password),
        onSuccess: async (data) => {
            const profile = await authApi.getProfile(data.user.id)
            queryClient.setQueryData(['session'], data.session)
            queryClient.setQueryData(['profile', data.user.id], profile)
        }
    })

    const pinLoginMutation = useMutation({
        mutationFn: (pin) => authApi.signInWithPin(pin),
        onSuccess: (profile) => {
            localStorage.setItem('pos_profile', JSON.stringify(profile))
            queryClient.setQueryData(['profile', 'current'], profile)
        }
    })

    const logoutMutation = useMutation({
        mutationFn: authApi.signOut,
        onSuccess: () => {
            queryClient.clear()
            window.location.href = '/pin-login'
        }
    })

    return {
        login: loginMutation.mutateAsync,
        loginWithPin: pinLoginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending || pinLoginMutation.isPending,
        isLoggingOut: logoutMutation.isPending
    }
}
