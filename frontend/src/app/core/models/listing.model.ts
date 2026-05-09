import { Category } from './category.model';
import { User } from './user.model';

export interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  category_id: Category | string;
  user_id: User | string;
  status: 'active' | 'inactive' | 'sold';
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListingPayload {
  title: string;
  description: string;
  price: number;
  location: string;
  category_id: string;
  status?: 'active' | 'inactive' | 'sold';
  images?: string[];
}

export interface ListingFilters {
  search?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'sold';
  sort?: 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  ids?: string[];
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}
