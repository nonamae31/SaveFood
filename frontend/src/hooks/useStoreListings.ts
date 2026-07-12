import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStoreListings,
  createStoreListing,
  updateStoreListing,
  deleteStoreListing,
  uploadStoreListingImages,
  deleteStoreListingImage,
  toggleStoreListingVisibility,
  getListingRuleTemplates,
} from '@/api/store.listings.api'
import type { CreateListingDTO, UpdateListingDTO } from '@/types/store.types'

export const STORE_LISTINGS_QUERY_KEY = (storeId: string) => ['store-listings', storeId]
export const STORE_RULE_TEMPLATES_KEY = (storeId: string) => ['store-rule-templates', storeId]

export function useStoreListings(storeId: string | undefined) {
  return useQuery({
    queryKey: STORE_LISTINGS_QUERY_KEY(storeId!),
    queryFn: () => getStoreListings(storeId!),
    enabled: !!storeId,
  })
}

export function useStoreRuleTemplates(storeId: string | undefined) {
  return useQuery({
    queryKey: STORE_RULE_TEMPLATES_KEY(storeId!),
    queryFn: () => getListingRuleTemplates(storeId!),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })
}

export function useCreateStoreListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, payload }: { storeId: string; payload: CreateListingDTO }) =>
      createStoreListing(storeId, payload),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_LISTINGS_QUERY_KEY(storeId) })
      queryClient.invalidateQueries({ queryKey: STORE_RULE_TEMPLATES_KEY(storeId) })
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
      queryClient.invalidateQueries({ queryKey: STORE_RULE_TEMPLATES_KEY(storeId) })
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

export function useToggleStoreListingVisibility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, listingId }: { storeId: string; listingId: string }) =>
      toggleStoreListingVisibility(storeId, listingId),
    onMutate: async ({ storeId, listingId }) => {
      await queryClient.cancelQueries({ queryKey: STORE_LISTINGS_QUERY_KEY(storeId) })
      const previousListings = queryClient.getQueryData<any[]>(STORE_LISTINGS_QUERY_KEY(storeId))
      
      if (previousListings) {
        queryClient.setQueryData<any[]>(STORE_LISTINGS_QUERY_KEY(storeId), (old) => 
          old?.map(listing => {
            if (listing.id === listingId) {
              const newStatus = listing.status === 1 ? 0 : 1
              return { ...listing, status: newStatus }
            }
            return listing
          })
        )
      }
      return { previousListings, storeId }
    },
    onSuccess: (data, { storeId }) => {
      // Update cache with the exact response from backend instantly
      queryClient.setQueryData<any[]>(STORE_LISTINGS_QUERY_KEY(storeId), (old) => 
        old?.map(listing => listing.id === data.id ? data : listing)
      )
    },
    onError: (err, variables, context) => {
      if (context?.previousListings) {
        queryClient.setQueryData(STORE_LISTINGS_QUERY_KEY(context.storeId), context.previousListings)
      }
      queryClient.invalidateQueries({ queryKey: STORE_LISTINGS_QUERY_KEY(context?.storeId || '') })
    },
    onSettled: (_, error, variables) => {
      queryClient.invalidateQueries({ queryKey: STORE_LISTINGS_QUERY_KEY(variables.storeId) })
    },
  })
}
