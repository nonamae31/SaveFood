export interface ComplaintDto {
  id: string;
  code: string;
  storeId?: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  title: string;
  description: string;
  status: string | number;
  type?: number;
  createdAt: string;
}
