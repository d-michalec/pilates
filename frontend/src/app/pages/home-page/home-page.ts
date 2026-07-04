import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { FitsseyWidget } from '../../widgets/fitssey-widget/fitssey-widget';

@Component({
  selector: 'app-home-page',
  imports: [ButtonModule, FitsseyWidget, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss'
})
export class HomePage {
}
