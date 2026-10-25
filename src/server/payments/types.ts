export interface PaymentRedirect {
  url: string;
  method: 'GET' | 'POST';
  fields?: Record<string, string>;
}

export interface PaymentRequest {
  donationId: string;
  amountMinor: number;
  description: string;
  donorName: string;
  donorEmail: string;
}

export interface PaymentVerification {
  donationId: string;
  reference: string;
  status: 'succeeded' | 'failed';
  /** Amount the gateway reports, in minor units. Compared with the stored donation. */
  amountMinor?: number;
  payload: Record<string, unknown>;
}

export interface PaymentGateway {
  readonly id: 'esewa' | 'khalti' | 'connectips' | 'fonepay';
  isConfigured(): boolean;
  start(request: PaymentRequest): Promise<PaymentRedirect>;
  verify(query: URLSearchParams): Promise<PaymentVerification>;
}
