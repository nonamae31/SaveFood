import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStoreListings,
  createStoreListing,
  updateStoreListing,
  deleteStoreListing,
  uploadStoreListingImages,
  deleteStoreListingImage,
} from '@/api/store.listings.api'
import type { CreateListingDTO, UpdateListingDTO } from '@/types/store.types'

export const STORE_LISTINGS_QUERY_KEY = (storeId: string) => ['store-listings', storeId]

export function useStoreListings(storeId: string | undefined) {
  return useQuery({
    queryKey: STORE_LISTINGS_QUERY_KEY(storeId!),
    queryFn: () => getStoreListings(storeId!),
    enabled: !!storeId,
  })
}

export function useCreateStoreListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, payload }: { storeId: string; payload: CreateListingDTO }) =>
      createStoreListing(storeId, payload),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_LISTINGS_QUERY_KEY(storeId) })
    },
  })
}

export function useUpdateStoreListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, listingId, payload }: { storeId: string; listingId: string; payload: UpdateListingDTO }) =>
      updateStoreListing(storeId, listingId, payload),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_LISTINGS_QUERY_KEY(storeId) })
    },
  })
}

export function useDeleteStoreListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, listingId }: { storeId: string; listingId: string }) =>
      deleteStoreListing(storeId, listingId),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_LISTINGS_QUERY_KEY(storeId) })
    },
  })
}

export function useUploadStoreListingImages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, listingId, formData }: { storeId: string; listingId: string; formData: FormData }) =>
      uploadStoreListingImages(storeId, listingId, formData),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_LISTINGS_QUERY_KEY(storeId) })
    },
  })
}

export function useDeleteStoreListingImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, listingId, imageId }: { storeId: string; listingId: string; imageId: string }) =>
      deleteStoreListingImage(storeId, listingId, imageId),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_LISTINGS_QUERY_KEY(storeId) })
    },
  })
}
