import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { branchApi, normalizeBranch } from '@/features/branches/api/branchApi'

const scopeBranchesForProfile = (branches, profile) => {
  if (!profile?.branch_id || profile?.role === 'admin') return branches
  return branches.filter((branch) => branch.id === profile.branch_id)
}

const pickCurrentBranch = ({ branches, currentBranch, profile }) => {
  const scopedBranches = scopeBranchesForProfile(branches, profile)
  if (profile?.branch_id) {
    return scopedBranches.find((branch) => branch.id === profile.branch_id) || null
  }

  if (currentBranch?.id) {
    const persisted = scopedBranches.find((branch) => branch.id === currentBranch.id)
    if (persisted) return persisted
  }

  return scopedBranches[0] || null
}

export const useBranchStore = create(
  persist(
    (set, get) => ({
      currentBranch: null,
      branches: [],
      loading: false,
      error: null,

      // Fetch all available branches
      fetchBranches: async () => {
        set({ loading: true })
        try {
          const branches = await branchApi.getBranches()
          const currentBranch = pickCurrentBranch({
            branches,
            currentBranch: get().currentBranch,
            profile: null
          })

          set({ branches, currentBranch, loading: false, error: null })
        } catch (err) {
          set({ error: err.message, loading: false })
        }
      },

      // Set current branch manually (for admins)
      setCurrentBranch: (branch) => {
        set({ currentBranch: branch ? normalizeBranch(branch) : null })
      },

      // Initialization logic called after auth
      initializeBranch: async (profile) => {
        set({ loading: true })
        try {
          const branches = await branchApi.getBranches()
          const scopedBranches = scopeBranchesForProfile(branches, profile)
          const currentBranch = pickCurrentBranch({
            branches,
            currentBranch: get().currentBranch,
            profile
          })

          set({
            branches: scopedBranches,
            currentBranch,
            loading: false,
            error: null
          })
        } catch (err) {
          console.error('Error initializing branch:', err)
          set({ error: err.message, loading: false })
        }
      }
    }),
    {
      name: 'branch-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ currentBranch: state.currentBranch }), // persist only currentBranch
    }
  )
)
