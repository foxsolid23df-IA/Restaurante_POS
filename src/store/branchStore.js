import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

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
          const { data, error } = await supabase
            .from('branches')
            .select('*')
            .eq('is_active', true)
          
          if (error) throw error
          
          set({ branches: data || [], loading: false })
          
          // If no branch is selected and we have branches, set the first one as default
          // unless the profile dictates otherwise (handled in initialize)
          if (!get().currentBranch && data?.length > 0) {
            set({ currentBranch: data[0] })
          }
        } catch (err) {
          set({ error: err.message, loading: false })
        }
      },

      // Set current branch manually (for admins)
      setCurrentBranch: (branch) => {
        set({ currentBranch: branch })
      },

      // Initialization logic called after auth
      initializeBranch: async (profile) => {
        set({ loading: true })
        try {
          // 1. Fetch branches
          const { data: branches, error } = await supabase
            .from('branches')
            .select('*')
            .eq('is_active', true)
          
          if (error) throw error
          set({ branches: branches || [] })

          // 2. Determine which branch to set
          // If profile has a fixed branch, use that.
          if (profile?.branch_id) {
            const profileBranch = branches.find(b => b.id === profile.branch_id)
            if (profileBranch) {
              set({ currentBranch: profileBranch })
            }
          } 
          // If no current branch is set in store yet, use first one
          else if (!get().currentBranch && branches.length > 0) {
            set({ currentBranch: branches[0] })
          }

          set({ loading: false })
        } catch (err) {
          console.error('Error initializing branch:', err)
          set({ loading: false })
        }
      }
    }),
    {
      name: 'branch-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ currentBranch: state.currentBranch }), // persist only currentBranch
    }
  )
)
