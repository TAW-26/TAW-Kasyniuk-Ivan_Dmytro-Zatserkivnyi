import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  type LoginForm = {
    setValue(value: { email: string; password: string }): void;
    controls: {
      email: { touched: boolean };
      password: { touched: boolean };
    };
  };
  type LoginComponentHarness = {
    form: LoginForm;
    loading: () => boolean;
    errorMessage: () => string | null;
  };

  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: { login: jest.Mock };
  let notifications: { show: jest.Mock };
  let router: Router;

  beforeEach(async () => {
    auth = { login: jest.fn() };
    notifications = { show: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  test('marks form controls as touched when submitted empty', () => {
    component.submit();

    const form = (component as unknown as LoginComponentHarness).form;
    expect(auth.login).not.toHaveBeenCalled();
    expect(form.controls.email.touched).toBe(true);
    expect(form.controls.password.touched).toBe(true);
  });

  test('logs in and navigates to ads page on valid credentials', () => {
    auth.login.mockReturnValue(
      of({
        accessToken: 'token',
        user: { _id: 'u1', username: 'Jan', email: 'jan@example.com', role: 'user' },
      }),
    );

    (component as unknown as LoginComponentHarness).form.setValue({
      email: 'jan@example.com',
      password: 'secret123',
    });
    component.submit();

    expect(auth.login).toHaveBeenCalledWith({
      email: 'jan@example.com',
      password: 'secret123',
    });
    expect(notifications.show).toHaveBeenCalledWith(expect.stringContaining('Zalogowano'));
    expect(router.navigate).toHaveBeenCalledWith(['/ads']);
    expect((component as unknown as LoginComponentHarness).loading()).toBe(false);
  });

  test('shows backend error message when login fails', () => {
    auth.login.mockReturnValue(
      throwError(() => ({
        error: { message: 'Nieprawidlowe dane' },
      })),
    );

    (component as unknown as LoginComponentHarness).form.setValue({
      email: 'jan@example.com',
      password: 'wrong',
    });
    component.submit();

    expect((component as unknown as LoginComponentHarness).errorMessage()).toBe('Nieprawidlowe dane');
    expect((component as unknown as LoginComponentHarness).loading()).toBe(false);
  });
});
