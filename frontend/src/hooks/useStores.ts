import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { storeApi, type StoreProfileDTO } from '@/api/store.api'

export interface CustomerStoreDTO {
  id: string
  name: string
  category: string
  rating: number | null
  address: string
  imageUrl: string
  tags: string[]
  priorityLevel: number
  hasFeaturedBadge: boolean
  distance?: number
  latitude?: number
  longitude?: number
}

export interface CustomerStoreDetailDTO extends CustomerStoreDTO {
  phone: string
  openingHours: string
  coverImage: string
  description: string
}

export interface CustomerStoreFilter {
  searchQuery?: string
  userLat?: number
  userLng?: number
  radiusKm?: number
}

export function useStores(filter?: CustomerStoreFilter) {
  return useQuery({
    queryKey: ['customer-stores', filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter?.searchQuery) params.set('searchQuery', filter.searchQuery)
      if (filter?.userLat !== undefined) params.set('userLat', String(filter.userLat))
      if (filter?.userLng !== undefined) params.set('userLng', String(filter.userLng))
      if (filter?.radiusKm !== undefined) params.set('radiusKm', String(filter.radiusKm))
      
      const qs = params.toString()
      return await apiClient<CustomerStoreDTO[]>(`/stores${qs ? `?${qs}` : ''}`)
    },
  })
}

export function useStoreDetail(id?: string) {
  return useQuery({
    queryKey: ['customer-stores', id],
    queryFn: async () => {
      if (!id) throw new Error('Store ID is required')
      return await apiClient<CustomerStoreDetailDTO>(`/stores/${id}`)
    },
    enabled: !!id,
  })
}

export function useStoreProfile(storeId?: string) {
  return useQuery({
    queryKey: ['store-profile', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID is required')
      return await storeApi.getStoreProfile(storeId)
    },
    enabled: !!storeId,
  })
}

export function useStoreAnalytics(storeId?: string, days: number = 7) {
  return useQuery({
    queryKey: ['store-analytics', storeId, days],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID is required')
      return await storeApi.getStoreAnalytics(storeId, days)
    },
    enabled: !!storeId,
  })
}
