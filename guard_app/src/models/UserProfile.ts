import { Address } from "./Address";
import { License } from "./License";

export type UserProfile = {
  _id: string;
  name: string;
  email: string;
  role: 'guard'; // Guard role only
  phone?: string;
  address?: Address;
  license?: License;
  rating?: number;
  numberOfReviews?: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
};
