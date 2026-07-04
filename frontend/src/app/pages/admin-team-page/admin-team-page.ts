import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { TeamMember } from '../../core/team-member';
import { TeamService } from '../../core/team.service';

@Component({
  selector: 'app-admin-team-page',
  imports: [
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    RouterLink,
    TagModule,
    TextareaModule
  ],
  templateUrl: './admin-team-page.html',
  styleUrl: './admin-team-page.scss'
})
export class AdminTeamPage implements OnInit, OnDestroy {
  protected readonly team = signal<TeamMember[]>([]);
  protected readonly selectedPhoto = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(4000)]
    })
  });

  constructor(private readonly teamService: TeamService) {}

  ngOnInit() {
    this.loadTeam();
  }

  ngOnDestroy() {
    this.revokePreviewUrl();
  }

  protected onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!file) {
      this.selectedPhoto.set(null);
      this.revokePreviewUrl();
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.selectedPhoto.set(null);
      this.revokePreviewUrl();
      this.errorMessage.set('Dodaj plik JPG, PNG albo WebP.');
      input.value = '';
      return;
    }

    this.selectedPhoto.set(file);
    this.revokePreviewUrl();
    this.previewUrl.set(URL.createObjectURL(file));
  }

  protected clearPhoto(input: HTMLInputElement) {
    input.value = '';
    this.selectedPhoto.set(null);
    this.revokePreviewUrl();
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  protected submit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.form.invalid || !this.selectedPhoto()) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Uzupelnij imie i nazwisko, opis oraz zdjecie.');
      return;
    }

    const { fullName, description } = this.form.getRawValue();
    const photo = this.selectedPhoto();

    if (!photo) {
      return;
    }

    this.isSaving.set(true);
    this.teamService
      .create({ fullName, description, photo })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (created) => {
          this.team.update((team) => [created, ...team]);
          this.form.reset();
          this.selectedPhoto.set(null);
          this.revokePreviewUrl();
          this.successMessage.set('Osoba zostala dodana do kadry.');
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.message ?? 'Nie udalo sie dodac osoby.');
        }
      });
  }

  private loadTeam() {
    this.isLoading.set(true);
    this.teamService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (team) => this.team.set(team),
        error: () => this.errorMessage.set('Nie udalo sie pobrac listy kadry.')
      });
  }

  private revokePreviewUrl() {
    const previewUrl = this.previewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.previewUrl.set(null);
    }
  }
}
