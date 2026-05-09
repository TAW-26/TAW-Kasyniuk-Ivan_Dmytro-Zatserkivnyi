import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Listing, ListingFilters, ListingPayload, ListingsResponse } from '../models/listing.model';

@Injectable({ providedIn: 'root' })
export class ListingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/listings`;

  private buildParams(filters: ListingFilters): HttpParams {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.location) params = params.set('location', filters.location);
    if (filters.ids && filters.ids.length > 0) params = params.set('ids', filters.ids.join(','));
    return params;
  }

  getAll(filters: ListingFilters = {}): Observable<Listing[]> {
    return this.http
      .get<ListingsResponse>(this.baseUrl, { params: this.buildParams(filters) })
      .pipe(map((res) => res.listings));
  }

  getPaged(filters: ListingFilters = {}): Observable<ListingsResponse> {
    return this.http.get<ListingsResponse>(this.baseUrl, { params: this.buildParams(filters) });
  }

  getOne(id: string): Observable<Listing> {
    return this.http.get<Listing>(`${this.baseUrl}/${id}`);
  }

  getMine(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/user/my`);
  }

  create(payload: ListingPayload): Observable<Listing> {
    return this.http.post<Listing>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<ListingPayload>): Observable<Listing> {
    return this.http.put<Listing>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  markAsSold(id: string): Observable<Listing> {
    return this.http.post<Listing>(`${this.baseUrl}/${id}/mark-sold`, {});
  }
}
