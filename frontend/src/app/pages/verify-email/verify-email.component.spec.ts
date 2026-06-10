import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { VerifyEmailComponent } from './verify-email.component';

describe('VerifyEmailComponent', () => {
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let auth: { verifyEmail: jest.Mock };

  beforeEach(async () => {
    auth = { verifyEmail: jest.fn().mockReturnValue(of({ message: 'Email zweryfikowany' })) };

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => 'verification-token' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();
  });

  test('verifies token from query string', () => {
    expect(auth.verifyEmail).toHaveBeenCalledWith('verification-token');
    expect(fixture.nativeElement.textContent).toContain('Email został zweryfikowany');
  });
});
