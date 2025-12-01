import apiClient from './api';

export interface Payment {
  id?: number;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'declined' | 'expired' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  description?: string;
  readableCode?: string;
  qrCode?: string;
  userId?: number;
}

export const paymentService = {
  // Get all payments
  async getPayments(): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>('/payments');
    return response.data;
  },

  // Get a single payment by ID
  async getPaymentById(id: number): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  // Get payment by paymentId (FIB payment ID)
  async getPaymentByPaymentId(paymentId: string): Promise<Payment | null> {
    const payments = await this.getPayments();
    return payments.find(p => p.paymentId === paymentId) || null;
  },

  // Create a new payment
  async createPayment(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
    const response = await apiClient.post<Payment>('/payments', paymentData);
    return response.data;
  },

  // Update an existing payment
  async updatePayment(id: number, paymentData: Partial<Payment>): Promise<Payment> {
    const response = await apiClient.put<Payment>(`/payments/${id}`, paymentData);
    return response.data;
  },

  // Update payment by paymentId
  async updatePaymentByPaymentId(paymentId: string, paymentData: Partial<Payment>): Promise<Payment | null> {
    const payment = await this.getPaymentByPaymentId(paymentId);
    if (!payment || !payment.id) return null;
    return this.updatePayment(payment.id, paymentData);
  },

  // Delete a payment
  async deletePayment(id: number): Promise<void> {
    await apiClient.delete(`/payments/${id}`);
  },
};

