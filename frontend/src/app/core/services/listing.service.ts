import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Listing, ListingFilters, ListingPayload } from '../models/listing.model';

@Injectable({ providedIn: 'root' })
export class ListingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/listings`;

  getAll(filters: ListingFilters = {}): Observable<Listing[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.sort) params = params.set('sort', filters.sort);
    return this.http.get<Listing[]>(this.baseUrl, { params });
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

  purchase(id: string): Observable<Listing> {
    return this.http.post<Listing>(`${this.baseUrl}/${id}/purchase`, {});
  }
}
