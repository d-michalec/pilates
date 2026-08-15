import { Routes } from '@angular/router';

import { adminGuard } from './core/admin.guard';
import { AdminEventsPage } from './pages/admin-events-page/admin-events-page';
import { AdminClassesPage } from './pages/admin-classes-page/admin-classes-page';
import { AdminLoginPage } from './pages/admin-login-page/admin-login-page';
import { AdminContactPage } from './pages/admin-contact-page/admin-contact-page';
import { AdminFaqPage } from './pages/admin-faq-page/admin-faq-page';
import { AdminSaunaPage } from './pages/admin-sauna-page/admin-sauna-page';
import { AdminBarPage } from './pages/admin-bar-page/admin-bar-page';
import { AdminLandingPage } from './pages/admin-landing-page/admin-landing-page';
import { AdminNewsletterPage } from './pages/admin-newsletter-page/admin-newsletter-page';
import { AdminTeamPage } from './pages/admin-team-page/admin-team-page';
import { BarPage } from './pages/bar-page/bar-page';
import { ContactPage } from './pages/contact-page/contact-page';
import { EventDetailPage } from './pages/event-detail-page/event-detail-page';
import { EventsPage } from './pages/events-page/events-page';
import { FaqPage } from './pages/faq-page/faq-page';
import { HomePage } from './pages/home-page/home-page';
import { PilatesPage } from './pages/pilates-page/pilates-page';
import { SaunaPage } from './pages/sauna-page/sauna-page';
import { SchedulePage } from './pages/schedule-page/schedule-page';
import { TeamPage } from './pages/team-page/team-page';

/**
 * Trasy publiczne trzymamy w jednej tablicy i montujemy dwa razy: bez prefiksu dla
 * polskiego i pod /en dla angielskiego. Dzięki temu nowa podstrona automatycznie
 * dostaje obie wersje i nie da się o jedną zapomnieć.
 */
const publicRoutes: Routes = [
  {
    path: '',
    component: HomePage
  },
  {
    path: 'kadra',
    component: TeamPage
  },
  {
    path: 'pilates',
    component: PilatesPage
  },
  {
    path: 'sauna',
    component: SaunaPage
  },
  {
    path: 'bar',
    component: BarPage
  },
  {
    path: 'grafik',
    component: SchedulePage
  },
  {
    path: 'faq',
    component: FaqPage
  },
  {
    path: 'kontakt',
    component: ContactPage
  },
  {
    path: 'wydarzenia',
    component: EventsPage
  },
  {
    path: 'event/:id',
    component: EventDetailPage
  }
];

export const routes: Routes = [
  ...publicRoutes,
  {
    path: 'en',
    children: publicRoutes
  },
  {
    path: 'admin/login',
    component: AdminLoginPage
  },
  {
    path: 'admin/landing',
    component: AdminLandingPage,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/eventy',
    component: AdminEventsPage,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/zajecia',
    component: AdminClassesPage,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/newsletter',
    component: AdminNewsletterPage,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/kadra',
    component: AdminTeamPage,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/sauna',
    component: AdminSaunaPage,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/bar',
    component: AdminBarPage,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/faq',
    component: AdminFaqPage,
    canActivate: [adminGuard]
  },
  {
    path: 'admin/kontakt',
    component: AdminContactPage,
    canActivate: [adminGuard]
  }
];
