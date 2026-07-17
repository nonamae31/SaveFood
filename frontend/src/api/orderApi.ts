import { apiClient } from '@/lib/apiClient';

export interface ReserveRequest {
    cartItemIds: string[];
}

export interface ReserveResponse {
    expiresAt: string;
    success: boolean;
}

export interface CheckoutRequest {
    cartItemIds: string[];
    paymentMethod: number;
    expectedPickupTime: string;
    agreedToNoRefundPolicy: boolean;
    returnUrl?: string;
    cancelUrl?: string;
    applyVoucherAmount?: number;
}

export interface CheckoutResponse {
    orderId: string;
    pickupCode: string;
    checkoutUrl?: string;
    reservationExpiresAt?: string;
}

export const orderApi = {
    reserve: async (data: ReserveRequest): Promise<ReserveResponse> => {
        return apiClient<ReserveResponse>("/orders/reserve", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Idempotency-Key": crypto.randomUUID()
            }
        });
    },
    checkout: async (data: CheckoutRequest): Promise<CheckoutResponse> => {
        return apiClient<CheckoutResponse>("/orders/checkout", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }
};
