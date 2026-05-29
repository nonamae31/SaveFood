import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export interface CustomerStoreDTO {
  id: string
  name: string
  category: string
  rating: number
  address: string
  imageUrl: string
  tags: string[]
  priorityLevel: number
  hasFeaturedBadge: boolean
}

export interface CustomerStoreDetailDTO extends CustomerStoreDTO {
  phone: string
  openingHours: string
  coverImage: string
  description: string
}

export function useStores() {
  return useQuery({
    queryKey: ['customer-stores'],
    queryFn: async () => {
      return await apiClient<CustomerStoreDTO[]>('/stores')
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
