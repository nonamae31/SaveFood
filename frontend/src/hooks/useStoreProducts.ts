import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  uploadStoreProductImages,
  deleteStoreProductImage
} from '@/api/store.products.api'
import type { CreateProductDTO, UpdateProductDTO } from '@/types/store.types'

export const STORE_PRODUCTS_QUERY_KEY = (storeId: string) => ['store-products', storeId]

export function useStoreProducts(storeId: string | undefined) {
  return useQuery({
    queryKey: STORE_PRODUCTS_QUERY_KEY(storeId!),
    queryFn: () => getStoreProducts(storeId!),
    enabled: !!storeId,
  })
}

export function useCreateStoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, payload }: { storeId: string; payload: CreateProductDTO }) =>
      createStoreProduct(storeId, payload),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_PRODUCTS_QUERY_KEY(storeId) })
    },
  })
}

export function useUpdateStoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, productId, payload }: { storeId: string; productId: string; payload: UpdateProductDTO }) =>
      updateStoreProduct(storeId, productId, payload),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_PRODUCTS_QUERY_KEY(storeId) })
    },
  })
}

export function useDeleteStoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, productId }: { storeId: string; productId: string }) =>
      deleteStoreProduct(storeId, productId),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_PRODUCTS_QUERY_KEY(storeId) })
    },
  })
}

export function useUploadStoreProductImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, productId, formData }: { storeId: string; productId: string; formData: FormData }) =>
      uploadStoreProductImages(storeId, productId, formData),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_PRODUCTS_QUERY_KEY(storeId) })
    },
  })
}

export function useDeleteStoreProductImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, productId, imageId }: { storeId: string; productId: string; imageId: string }) =>
      deleteStoreProductImage(storeId, productId, imageId),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: STORE_PRODUCTS_QUERY_KEY(storeId) })
    },
  })
}
