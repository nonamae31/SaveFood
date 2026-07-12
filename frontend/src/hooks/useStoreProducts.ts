import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  uploadStoreProductImages,
  deleteStoreProductImage,
  toggleStoreProductVisibility,
  bulkToggleStoreProductVisibility
} from '@/api/store.products.api'
import type { ProductResponseDTO, CreateProductDTO, UpdateProductDTO, BulkToggleVisibilityDTO } from '@/types/store.types'

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

export function useToggleStoreProductVisibility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, productId }: { storeId: string; productId: string }) =>
      toggleStoreProductVisibility(storeId, productId),
    onMutate: async ({ storeId, productId }) => {
      await queryClient.cancelQueries({ queryKey: STORE_PRODUCTS_QUERY_KEY(storeId) })
      const previousProducts = queryClient.getQueryData<ProductResponseDTO[]>(STORE_PRODUCTS_QUERY_KEY(storeId))
      
      if (previousProducts) {
        queryClient.setQueryData<ProductResponseDTO[]>(STORE_PRODUCTS_QUERY_KEY(storeId), old => 
          old?.map(product => 
            product.id === productId ? { ...product, isHidden: !product.isHidden } : product
          )
        )
      }
      return { previousProducts, storeId }
    },
    onSuccess: (data, { storeId }) => {
      queryClient.setQueryData<ProductResponseDTO[]>(STORE_PRODUCTS_QUERY_KEY(storeId), old => 
        old?.map(product => product.id === data.id ? data : product)
      )
    },
    onError: (err, variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(STORE_PRODUCTS_QUERY_KEY(context.storeId), context.previousProducts)
      }
    },
    onSettled: (_, error, variables) => {
      queryClient.invalidateQueries({ queryKey: STORE_PRODUCTS_QUERY_KEY(variables.storeId) })
    },
  })
}

export function useBulkToggleStoreProductVisibility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storeId, payload }: { storeId: string; payload: BulkToggleVisibilityDTO }) =>
      bulkToggleStoreProductVisibility(storeId, payload),
    onMutate: async ({ storeId, payload }) => {
      await queryClient.cancelQueries({ queryKey: STORE_PRODUCTS_QUERY_KEY(storeId) })
      const previousProducts = queryClient.getQueryData<ProductResponseDTO[]>(STORE_PRODUCTS_QUERY_KEY(storeId))
      
      if (previousProducts) {
        queryClient.setQueryData<ProductResponseDTO[]>(STORE_PRODUCTS_QUERY_KEY(storeId), old => 
          old?.map(product => 
            payload.productIds.includes(product.id) ? { ...product, isHidden: payload.isHidden } : product
          )
        )
      }
      return { previousProducts, storeId }
    },
    onError: (err, variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(STORE_PRODUCTS_QUERY_KEY(context.storeId), context.previousProducts)
      }
    },
    onSettled: (_, error, variables) => {
      queryClient.invalidateQueries({ queryKey: STORE_PRODUCTS_QUERY_KEY(variables.storeId) })
    },
  })
}
