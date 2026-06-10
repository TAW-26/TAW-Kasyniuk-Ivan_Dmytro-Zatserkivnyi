import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ListingService } from '../../../core/services/listing.service';
import { Listing } from '../../../core/models/listing.model';
import { AdCardComponent } from './ad-card.component';

const listing: Listing = {
  _id: 'l1',
  title: 'Telefon',
  description: 'Sprawny telefon',
  price: 500,
  location: 'Warszawa',
  category_id: { _id: 'c1', name: 'Elektronika' },
  user_id: 'u1',
  status: 'active',
  images: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('AdCardComponent', () => {
  let fixture: ComponentFixture<AdCardComponent>;
  let component: AdCardComponent;
  let favorites: { isFavorite: jest.Mock; toggle: jest.Mock; removeId: jest.Mock };
  let listingService: { remove: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    favorites = {
      isFavorite: jest.fn(() => false),
      toggle: jest.fn(),
      removeId: jest.fn(),
    };
    listingService = {
      remove: jest.fn(() => of({ message: 'ok', _id: 'l1' })),
    };

    await TestBed.configureTestingModule({
      imports: [AdCardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: jest.fn(() => true), isAdmin: jest.fn(() => false) } },
        { provide: FavoritesService, useValue: favorites },
        { provide: ListingService, useValue: listingService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AdCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ad', listing);
    fixture.detectChanges();
  });

  test('renders listing details', () => {
    expect(fixture.nativeElement.querySelector('.listing-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ad-card')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Telefon');
    expect(fixture.nativeElement.textContent).toContain('Warszawa');
  });

  test('navigates to listing details when card is opened', () => {
    component.open();

    expect(router.navigate).toHaveBeenCalledWith(['/ads', 'l1']);
  });

  test('toggles favorite without opening listing details', () => {
    const event = { stopPropagation: jest.fn() } as unknown as MouseEvent;

    component.toggleFav(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(favorites.toggle).toHaveBeenCalledWith('l1');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
