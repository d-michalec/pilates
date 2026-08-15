import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { finalize } from 'rxjs';

import { AdminHeader } from '../../layout/admin-header/admin-header';
import { TeamMember } from '../../core/team-member';
import { TeamService } from '../../core/team.service';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'app-admin-team-page',
  imports: [AdminHeader, ButtonModule, CardModule, InputTextModule, MessageModule, ReactiveFormsModule, TagModule, TextareaModule],
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

  /** Null oznacza tryb dodawania, identyfikator - tryb edycji istniejącej osoby. */
  protected readonly editedMemberId = signal<string | null>(null);
  protected readonly memberPendingDeletion = signal<TeamMember | null>(null);
  protected readonly reorderingId = signal<string | null>(null);

  protected readonly editedMember = computed(() => {
    const id = this.editedMemberId();
    return id === null ? null : (this.team().find((member) => member.id === id) ?? null);
  });
  protected readonly isEditing = computed(() => this.editedMemberId() !== null);

  protected readonly form = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)]
    }),
    // Tłumaczenie jest opcjonalne - puste pole zapisuje się jako brak tłumaczenia.
    descriptionEn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(4000)]
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
    this.clearMessages();

    if (!file) {
      this.selectedPhoto.set(null);
      this.revokePreviewUrl();
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
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
    this.clearMessages();
  }

  protected startEditing(member: TeamMember) {
    this.clearMessages();
    this.editedMemberId.set(member.id);
    this.form.setValue({
      fullName: member.fullName,
      description: member.description,
      descriptionEn: member.descriptionEn ?? ''
    });
    this.selectedPhoto.set(null);
    this.revokePreviewUrl();
  }

  protected cancelEditing(photoInput?: HTMLInputElement) {
    this.editedMemberId.set(null);
    this.form.reset();
    this.selectedPhoto.set(null);
    this.revokePreviewUrl();
    this.clearMessages();

    if (photoInput) {
      photoInput.value = '';
    }
  }

  protected submit(photoInput?: HTMLInputElement) {
    this.clearMessages();

    const photo = this.selectedPhoto();
    // Przy dodawaniu zdjęcie jest wymagane, przy edycji jego brak oznacza "bez zmian".
    if (this.form.invalid || (!this.isEditing() && !photo)) {
      this.form.markAllAsTouched();
      this.errorMessage.set(
        this.isEditing() ? 'Uzupełnij imię i nazwisko oraz opis.' : 'Uzupełnij imię i nazwisko, opis oraz zdjęcie.'
      );
      return;
    }

    const { fullName, description, descriptionEn } = this.form.getRawValue();
    const editedId = this.editedMemberId();

    this.isSaving.set(true);

    const request = editedId
      ? this.teamService.update(editedId, { fullName, description, descriptionEn, photo })
      : this.teamService.create({ fullName, description, descriptionEn, photo: photo as File });

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (saved) => {
        if (editedId) {
          this.team.update((team) => team.map((member) => (member.id === editedId ? saved : member)));
          this.successMessage.set('Zmiany zostały zapisane.');
        }
        else {
          this.team.update((team) => [...team, saved]);
          this.successMessage.set('Osoba została dodana do kadry.');
        }

        this.editedMemberId.set(null);
        this.form.reset();
        this.selectedPhoto.set(null);
        this.revokePreviewUrl();

        if (photoInput) {
          photoInput.value = '';
        }
      },
      error: (error) => this.errorMessage.set(this.toMessage(error, 'Nie udało się zapisać osoby.'))
    });
  }

  protected askForDeletion(member: TeamMember) {
    this.clearMessages();
    this.memberPendingDeletion.set(member);
  }

  protected cancelDeletion() {
    this.memberPendingDeletion.set(null);
  }

  protected confirmDeletion() {
    const member = this.memberPendingDeletion();
    if (!member) {
      return;
    }

    this.isSaving.set(true);
    this.teamService
      .delete(member.id)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.team.update((team) => team.filter((item) => item.id !== member.id));
          this.memberPendingDeletion.set(null);
          this.successMessage.set(`Usunięto osobę ${member.fullName}.`);

          if (this.editedMemberId() === member.id) {
            this.cancelEditing();
          }
        },
        error: (error) => {
          this.memberPendingDeletion.set(null);
          this.errorMessage.set(this.toMessage(error, 'Nie udało się usunąć osoby.'));
        }
      });
  }

  protected move(member: TeamMember, offset: -1 | 1) {
    const current = this.team();
    const index = current.findIndex((item) => item.id === member.id);
    const targetIndex = index + offset;

    if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
      return;
    }

    const reordered = [...current];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    // Pokazujemy nową kolejność od razu, ale cofamy ją, jeśli zapis się nie powiedzie.
    this.team.set(reordered);
    this.clearMessages();
    this.reorderingId.set(member.id);

    this.teamService
      .reorder(reordered.map((item) => item.id))
      .pipe(finalize(() => this.reorderingId.set(null)))
      .subscribe({
        next: (saved) => this.team.set(saved),
        error: (error) => {
          this.team.set(current);
          this.errorMessage.set(this.toMessage(error, 'Nie udało się zmienić kolejności.'));
        }
      });
  }

  protected isFirst(member: TeamMember) {
    return this.team()[0]?.id === member.id;
  }

  protected isLast(member: TeamMember) {
    const team = this.team();
    return team[team.length - 1]?.id === member.id;
  }

  protected photoUrl(member: TeamMember) {
    return member.image.thumbnailUrl || member.image.url;
  }

  private loadTeam() {
    this.isLoading.set(true);
    this.teamService
      .list()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (team) => this.team.set(team),
        error: () => this.errorMessage.set('Nie udało się pobrać listy kadry.')
      });
  }

  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private toMessage(error: unknown, fallback: string) {
    const message = (error as { error?: { message?: string } })?.error?.message;
    return message ?? fallback;
  }

  private revokePreviewUrl() {
    const previewUrl = this.previewUrl();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      this.previewUrl.set(null);
    }
  }
}
