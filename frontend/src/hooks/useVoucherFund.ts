import { useQuery } from '@tanstack/react-query';
import { voucherFundApi } from '@/api/voucherFund.api';
import type { VoucherFund } from '@/api/voucherFund.api';

export const VOUCHER_FUND_QUERY_KEY = ['voucher-fund'] as const;

export function useVoucherFund() {
  return useQuery<VoucherFund>({
    queryKey: VOUCHER_FUND_QUERY_KEY,
    queryFn: voucherFundApi.getMyVoucherFund,
  });
}
