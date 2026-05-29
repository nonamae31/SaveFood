import { apiClient } from './client'

export const storeApi = {
  updateStoreImages: async (storeId: string, formData: FormData): Promise<void> => {
    await apiClient(`/stores/${storeId}/images`, {
      method: 'PUT',
      body: formData,
    })
  }
}
