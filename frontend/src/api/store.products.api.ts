import { apiClient } from './client'
import type { 
  ProductResponseDTO, 
  CreateProductDTO, 
  UpdateProductDTO 
} from '@/types/store.types'

export function getStoreProducts(storeId: string): Promise<ProductResponseDTO[]> {
  return apiClient<ProductResponseDTO[]>(`/stores/${storeId}/products`)
}

export function getStoreProduct(storeId: string, productId: string): Promise<ProductResponseDTO> {
  return apiClient<ProductResponseDTO>(`/stores/${storeId}/products/${productId}`)
}

export function createStoreProduct(storeId: string, payload: CreateProductDTO): Promise<ProductResponseDTO> {
  return apiClient<ProductResponseDTO>(`/stores/${storeId}/products`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateStoreProduct(storeId: string, productId: string, payload: UpdateProductDTO): Promise<void> {
  return apiClient<void>(`/stores/${storeId}/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteStoreProduct(storeId: string, productId: string): Promise<void> {
  return apiClient<void>(`/stores/${storeId}/products/${productId}`, {
    method: 'DELETE',
  })
}
