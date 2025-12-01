import axios from "axios";

// Use JSON server proxy in development to avoid CORS, direct URL in production
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    // Use JSON server proxy (same origin, no CORS)
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }
  // Production: use direct FIB API URL
  return `https://fib.${import.meta.env.VITE_FIB_ENV}.fib.iq`;
};

const fibApiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
});

fibApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('fibAuthToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ENDPOINTS = {
  AUTH: "/api/fib/auth/realms/fib-online-shop/protocol/openid-connect/token",
  CREATE_PAYMENT: "/api/fib/protected/v1/payments",
  CHECK_PAYMENT: (paymentId: string) =>  `/api/fib/protected/v1/payments/${paymentId}/status`,
  CANCEL_PAYMENT: (paymentId: string) =>  `/api/fib/protected/v1/payments/${paymentId}/cancel`,
  REFUND_PAYMENT: (paymentId: string) =>  `/api/fib/protected/v1/payments/${paymentId}/refund`,
}

interface Payment {
  monetaryValue: {
    amount: string;
    currency: string;
  };
  statusCallbackUrl?: string ;
  description: string;
  redirectUri?: string;
  expiresIn?: string;
  category?: string;
  refundableFor?: string;
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
  paidAt?: string;
  amount: {
    amount: number;
    currency: string;
  };
  decliningReason?: string;
  declinedAt?: string;
  paidBy?: string;
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
    return response.data;
  },

  async createPayment(payment: Payment): Promise<CreatePaymentResponse> {
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