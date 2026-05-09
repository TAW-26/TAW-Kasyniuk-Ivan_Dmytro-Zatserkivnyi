import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  type RegisterForm = {
    setValue(value: { username: string; email: string; password: string; confirmPassword: string }): void;
    hasError(errorCode: string): boolean;
  };
  type RegisterComponentHarness = {
    form: RegisterForm;
    emailSent: () => boolean;
    registeredEmail: () => string;
  };

  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let auth: { register: jest.Mock; login: jest.Mock };
  let notifications: { show: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    auth = {
      register: jest.fn(),
      login: jest.fn(),
    };
    notifications = { show: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  test('keeps form invalid when passwords do not match', () => {
    (component as unknown as RegisterComponentHarness).form.setValue({
      username: 'Jan',
      email: 'jan@example.com',
      password: 'secret123',
      confirmPassword: 'different',
    });

    expect((component as unknown as RegisterComponentHarness).form.hasError('passwordsMismatch')).toBe(true);
  });

  test('shows email verification state when backend requires verification', () => {
    auth.register.mockReturnValue(
      of({
        _id: 'u1',
        username: 'Jan',
        email: 'jan@example.com',
        requiresVerification: true,
      }),
    );

    (component as unknown as RegisterComponentHarness).form.setValue({
      username: 'Jan',
      email: 'jan@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    component.submit();

    expect(auth.register).toHaveBeenCalledWith({
      username: 'Jan',
      email: 'jan@example.com',
      password: 'secret123',
    });
    expect(auth.login).not.toHaveBeenCalled();
    expect((component as unknown as RegisterComponentHarness).emailSent()).toBe(true);
    expect((component as unknown as RegisterComponentHarness).registeredEmail()).toBe('jan@example.com');
  });
});
