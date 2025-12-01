import axios from "axios";
import type { Optional } from "@/types/common.types";

const fibApiClient = axios.create({
  baseURL: `https://fib.${import.meta.env.VITE_FIB_ENV}.fib.iq`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('fibAuthToken')}`,
  },
});

const ENDPOINTS = {
  AUTH: "/auth/realms/fib-online-shop/protocol/openid-connect/token",
  CREATE_PAYMENT: "/protected/v1/payments",
  CHECK_PAYMENT: (paymentId: string) =>  `/protected/v1/payments/${paymentId}/status`,
  CANCEL_PAYMENT: (paymentId: string) =>  `/protected/v1/payments/${paymentId}/cancel`,
  REFUND_PAYMENT: (paymentId: string) =>  `/protected/v1/payments/${paymentId}/refund`,
}

interface Payment {
  monetaryValue: {
    amount: string;
    currency: string;
  };
  statusCallbackUrl: Optional<string> ;
  description: string;
  redirectUri: Optional<string>;
  expiresIn: Optional<string>;
  category: Optional<string>;
  refundableFor: Optional<string>;
}

interface AuthorizationResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  not_before_policy: number;
  scope: string;
}

interface CreatePaymentResponse {
  paymentId: string;
  readableCode: string;
  qrCode: string;
  validUntil: string;
  personalAppLink: string;
  businessAppLink: string;
  corporateAppLink: string;
}

interface CheckPaymentResponse {
  paymentId: string;
  status: string;
  validUntil: number;
  paidAt: Optional<string>;
  amount: {
    amount: number;
    currency: string;
  };
  decliningReason: Optional<string>;
  declinedAt: Optional<string>;
  paidBy: Optional<string>;
}

function encodeParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => 
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
}

export const fibService = {

  async authorize() {
    
    const response = await fibApiClient.post<AuthorizationResponse>(ENDPOINTS.AUTH, {
      grant_type: 'client_credentials',
      client_id: import.meta.env.VITE_FIB_CLIENT_ID,
      client_secret: import.meta.env.VITE_FIB_CLIENT_SECRET,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    localStorage.setItem('fibAuthToken', response.data.access_token);
  },

  async createPayment(payment: Payment) {
    const response = await fibApiClient.post(ENDPOINTS.CREATE_PAYMENT, payment);
    return response.data;
  },

  async checkPayment(paymentId: string) {
    const response = await fibApiClient.get(ENDPOINTS.CHECK_PAYMENT(paymentId));
    return response.data;
  },

  async cancelPayment(paymentId: string) {
    const response = await fibApiClient.post(ENDPOINTS.CANCEL_PAYMENT(paymentId));
    return response.data;
  },

  async refundPayment(paymentId: string) {
    const response = await fibApiClient.post(ENDPOINTS.REFUND_PAYMENT(paymentId));
    return response.data;
  },
};