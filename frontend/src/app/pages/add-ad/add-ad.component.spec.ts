import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ImagesService } from '../../core/services/images.service';
import { ListingService } from '../../core/services/listing.service';
import { NotificationService } from '../../core/services/notification.service';
import { AddAdComponent } from './add-ad.component';

describe('AddAdComponent', () => {
  type AddAdForm = {
    setValue(value: {
      title: string;
      category_id: string;
      price: number;
      location: string;
      description: string;
      status: 'active' | 'inactive' | 'sold';
    }): void;
    controls: {
      title: { touched: boolean };
      category_id: { touched: boolean };
    };
  };
  type AddAdComponentHarness = {
    form: AddAdForm;
    images: { set(value: string[]): void };
    loading: () => boolean;
  };

  let fixture: ComponentFixture<AddAdComponent>;
  let component: AddAdComponent;
  let listingService: { create: jest.Mock; update: jest.Mock; getOne: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    listingService = {
      create: jest.fn(),
      update: jest.fn(),
      getOne: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AddAdComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: jest.fn(() => null) } },
        { provide: ListingService, useValue: listingService },
        { provide: CategoryService, useValue: { getAll: jest.fn(() => of([{ _id: 'c1', name: 'Elektronika' }])) } },
        { provide: ImagesService, useValue: { fileToDataUrl: jest.fn() } },
        { provide: NotificationService, useValue: { show: jest.fn() } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(AddAdComponent);
    component = fixture.componentInstance;
  });

  test('does not submit when required listing fields are missing', () => {
    component.submit();

    const form = (component as unknown as AddAdComponentHarness).form;
    expect(listingService.create).not.toHaveBeenCalled();
    expect(form.controls.title.touched).toBe(true);
    expect(form.controls.category_id.touched).toBe(true);
  });

  test('creates listing with form values and selected images', () => {
    listingService.create.mockReturnValue(
      of({
        _id: 'l1',
        title: 'Telefon',
        description: 'Sprawny telefon',
        price: 500,
        location: 'Warszawa',
        category_id: 'c1',
        user_id: 'u1',
        status: 'active',
        images: ['img-data'],
        createdAt: '',
        updatedAt: '',
      }),
    );

    (component as unknown as AddAdComponentHarness).form.setValue({
      title: 'Telefon',
      category_id: 'c1',
      price: 500,
      location: 'Warszawa',
      description: 'Sprawny telefon',
      status: 'active',
    });
    (component as unknown as AddAdComponentHarness).images.set(['img-data']);
    component.submit();

    expect(listingService.create).toHaveBeenCalledWith({
      title: 'Telefon',
      description: 'Sprawny telefon',
      price: 500,
      location: 'Warszawa',
      category_id: 'c1',
      images: ['img-data'],
    });
    expect(router.navigate).toHaveBeenCalledWith(['/ads', 'l1']);
    expect((component as unknown as AddAdComponentHarness).loading()).toBe(false);
  });
});
