export enum LicenseStatus {
  NONE = 'none',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export type License = {
  imageUrl?: string;
  status: LicenseStatus;
  reviewedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
};
