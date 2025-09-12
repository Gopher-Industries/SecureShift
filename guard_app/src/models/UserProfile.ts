import { Address } from './Address';

export type UserProfile = {
  _id: string;
  name: string;
  email: string;
  role: 'guard' | 'employer';
  phone?: string;
  address?: Address;
  createdAt: string;
  updatedAt: string;
};
