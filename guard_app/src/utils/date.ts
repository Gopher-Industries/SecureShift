import { format } from 'date-fns';

export const formatDate = (isoDate: string): string => {
  try {
    return format(new Date(isoDate), 'dd MMM yyyy');
  } catch (error) {
    return isoDate; // fallback if parsing fails
  }
};
