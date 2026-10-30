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
  /**
   * Short gateway-safe reference (1–20 characters). ConnectIPS sends it as `TXNID` because its
   * field is capped at 20 characters; adapters that can carry the donation id ignore it.
   */
  reference?: string;
}

export interface PaymentVerification {
  donationId: string;
  reference: string;
  status: 'succeeded' | 'failed';
  /** Amount the gateway reports, in minor units. Compared with the stored donation. */
  amountMinor?: number;
  payload: Record<string, unknown>;
}

export type PaymentGatewayId = 'esewa' | 'khalti' | 'connectips' | 'fonepay';

export interface PaymentGateway {
  readonly id: PaymentGatewayId;
  /**
   * Names of the environment variables that are missing. Empty means the gateway can start.
   * Used by `isConfigured()` and shown on the admin Payments page, without exposing values.
   */
  missingEnvironment(): string[];
  isConfigured(): boolean;
  start(request: PaymentRequest): Promise<PaymentRedirect>;
  verify(query: URLSearchParams): Promise<PaymentVerification>;
}
