import { apiClient } from './client'
import type { 
  ListingResponseDTO, 
  CreateListingDTO, 
  UpdateListingDTO 
} from '@/types/store.types'

export function getStoreListings(storeId: string): Promise<ListingResponseDTO[]> {
  return apiClient<ListingResponseDTO[]>(`/stores/${storeId}/listings`)
}

export function getStoreListing(storeId: string, listingId: string): Promise<ListingResponseDTO> {
  return apiClient<ListingResponseDTO>(`/stores/${storeId}/listings/${listingId}`)
}

export function createStoreListing(storeId: string, payload: CreateListingDTO): Promise<ListingResponseDTO> {
  return apiClient<ListingResponseDTO>(`/stores/${storeId}/listings`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateStoreListing(storeId: string, listingId: string, payload: UpdateListingDTO): Promise<void> {
  return apiClient<void>(`/stores/${storeId}/listings/${listingId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteStoreListing(storeId: string, listingId: string): Promise<void> {
  return apiClient<void>(`/stores/${storeId}/listings/${listingId}`, {
    method: 'DELETE',
  })
}

export function uploadStoreListingImages(storeId: string, listingId: string, formData: FormData): Promise<ListingResponseDTO> {
  return apiClient<ListingResponseDTO>(`/stores/${storeId}/listings/${listingId}/images`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header to let browser set it with boundary
    headers: {
      'Accept': 'application/json'
    }
  })
}

export function deleteStoreListingImage(storeId: string, listingId: string, imageId: string): Promise<ListingResponseDTO> {
  return apiClient<ListingResponseDTO>(`/stores/${storeId}/listings/${listingId}/images/${imageId}`, {
    method: 'DELETE',
  })
}
