import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AdminAuthService } from '../../core/admin-auth.service';

interface AdminNavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-header.html',
  styleUrl: './admin-header.scss'
})
export class AdminHeader {
  /** Nazwa aktualnej sekcji, np. "Kadra". */
  @Input({ required: true }) heading = '';
  @Input() description = '';
  /** Publiczny odpowiednik sekcji, żeby dało się szybko zobaczyć efekt zmian. */
  @Input() previewLink: string | null = null;

  protected readonly navItems: AdminNavItem[] = [
    { path: '/admin/landing', label: 'Landing', icon: 'pi-home' },
    { path: '/admin/zajecia', label: 'Zajęcia', icon: 'pi-list' },
    { path: '/admin/eventy', label: 'Eventy', icon: 'pi-calendar' },
    { path: '/admin/kadra', label: 'Kadra', icon: 'pi-users' },
    { path: '/admin/sauna', label: 'Sauna', icon: 'pi-sun' },
    { path: '/admin/bar', label: 'Bar', icon: 'pi-shopping-bag' },
    { path: '/admin/faq', label: 'FAQ', icon: 'pi-question-circle' },
    { path: '/admin/kontakt', label: 'Kontakt', icon: 'pi-map-marker' },
    { path: '/admin/wiadomosci', label: 'Wiadomości', icon: 'pi-inbox' },
    { path: '/admin/newsletter', label: 'Newsletter', icon: 'pi-envelope' }
  ];

  private readonly adminAuthService = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly username = this.adminAuthService.username;

  protected logOut() {
    this.adminAuthService.logOut();
    void this.router.navigate(['/admin/login']);
  }
}
