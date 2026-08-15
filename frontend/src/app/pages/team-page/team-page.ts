import { Component, OnInit, signal, inject} from '@angular/core';
import { finalize } from 'rxjs';

import { TeamMember } from '../../core/team-member';
import { TeamService } from '../../core/team.service';
import { SeoService } from '../../core/seo.service';
import { SiteFooter } from '../../layout/site-footer/site-footer';
import { SiteHeader } from '../../layout/site-header/site-header';
import { TranslatePipe } from '../../core/localize.pipe';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-team-page',
  imports: [SiteFooter, SiteHeader, TranslatePipe],
  templateUrl: './team-page.html',
  styleUrl: './team-page.scss',
  host: { ngSkipHydration: 'true' }
})
export class TeamPage implements OnInit {
  private readonly languageService = inject(LanguageService);

  protected readonly team = signal<TeamMember[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(
    private readonly teamService: TeamService,
    private readonly seoService: SeoService
  ) {}

  /** Opis przychodzi jako jeden tekst - akapity rozdzielamy pustą linią. */
  protected paragraphs(description: string) {
    return description.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  }

  ngOnInit() {
    this.seoService.set({
      title: this.languageService.translate('seo.team.title'),
      description: this.languageService.translate('seo.team.description')
    });

    this.teamService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (team) => this.team.set(team),
        error: () => {
          this.team.set([]);
          this.errorMessage.set(null);
        }
      });
  }

  /** Wybiera wersję redagowaną w panelu; brak tłumaczenia oznacza polski tekst. */
  protected content(polish: string | null | undefined, english: string | null | undefined) {
    return this.languageService.content(polish, english);
  }

}
