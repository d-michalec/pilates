import { Routes } from '@angular/router';

import { AdminTeamPage } from './pages/admin-team-page/admin-team-page';
import { HomePage } from './pages/home-page/home-page';
import { TeamPage } from './pages/team-page/team-page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage
  },
  {
    path: 'kadra',
    component: TeamPage
  },
  {
    path: 'admin/kadra',
    component: AdminTeamPage
  }
];
