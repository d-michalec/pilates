import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { TeamMember } from '../../core/team-member';
import { TeamService } from '../../core/team.service';

@Component({
  selector: 'app-team-page',
  imports: [RouterLink],
  templateUrl: './team-page.html',
  styleUrl: './team-page.scss'
})
export class TeamPage implements OnInit {
  protected readonly team = signal<TeamMember[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor(private readonly teamService: TeamService) {}

  ngOnInit() {
    this.teamService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (team) => this.team.set(team),
        error: () => this.errorMessage.set('Nie udalo sie pobrac kadry.')
      });
  }
}
