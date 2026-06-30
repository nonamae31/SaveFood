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

export async function createStoreProduct(storeId: string, payload: CreateProductDTO): Promise<ProductResponseDTO> {
  return apiClient<ProductResponseDTO>(`/stores/${storeId}/products`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function updateStoreProduct(storeId: string, productId: string, payload: UpdateProductDTO): Promise<ProductResponseDTO> {
  return apiClient<ProductResponseDTO>(`/stores/${storeId}/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  })
}

export function deleteStoreProduct(storeId: string, productId: string): Promise<void> {
  return apiClient<void>(`/stores/${storeId}/products/${productId}`, {
    method: 'DELETE',
  })
}

export async function uploadStoreProductImages(storeId: string, productId: string, formData: FormData): Promise<ProductResponseDTO> {
  return apiClient<ProductResponseDTO>(`/stores/${storeId}/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  })
}

export async function deleteStoreProductImage(storeId: string, productId: string, imageId: string): Promise<ProductResponseDTO> {
  return apiClient<ProductResponseDTO>(`/stores/${storeId}/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
  })
}
