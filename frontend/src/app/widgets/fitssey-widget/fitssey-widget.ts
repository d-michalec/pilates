import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, Input, signal } from '@angular/core';
import { MessageModule } from 'primeng/message';

import { FITSSEY_STUDIO_UUID, FITSSEY_WIDGET_BASE_URL, isFitsseyConfigured } from '../../core/fitssey-widget.config';
import { FitsseyWidgetService } from '../../core/fitssey-widget.service';

type FitsseyWidgetType = 'schedule' | 'course';

@Component({
  selector: 'app-fitssey-widget',
  imports: [MessageModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './fitssey-widget.html',
  styleUrl: './fitssey-widget.scss'
})
export class FitsseyWidget implements AfterViewInit {
  @Input() widget: FitsseyWidgetType = 'schedule';
  @Input() hideHeader = true;

  protected readonly isConfigured = signal(isFitsseyConfigured());
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoading = signal(isFitsseyConfigured());
  protected readonly studioUuid = FITSSEY_STUDIO_UUID;
  protected readonly baseUrl = FITSSEY_WIDGET_BASE_URL;

  constructor(private readonly fitsseyWidgetService: FitsseyWidgetService) {}

  ngAfterViewInit() {
    if (!this.isConfigured()) {
      return;
    }

    void this.fitsseyWidgetService
      .init(FITSSEY_STUDIO_UUID)
      .then(() => {
        this.fitsseyWidgetService.mounted();
        this.isLoading.set(false);
      })
      .catch(() => {
        this.errorMessage.set('Nie udało się załadować widgetu Fitssey.');
        this.isLoading.set(false);
      });
  }
}
