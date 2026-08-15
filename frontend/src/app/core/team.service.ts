import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api-url';
import { CreateTeamMemberInput, TeamMember, UpdateTeamMemberInput } from './team-member';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly apiUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiUrl = `${apiBaseUrl}/api`;
  }

  list() {
    return this.http.get<TeamMember[]>(`${this.apiUrl}/team`);
  }

  create(input: CreateTeamMemberInput) {
    const formData = new FormData();
    formData.append('fullName', input.fullName);
    formData.append('description', input.description);
    formData.append('descriptionEn', input.descriptionEn ?? '');
    formData.append('photo', input.photo);

    return this.http.post<TeamMember>(`${this.apiUrl}/admin/team`, formData);
  }

  update(id: string, input: UpdateTeamMemberInput) {
    const formData = new FormData();
    formData.append('fullName', input.fullName);
    formData.append('description', input.description);
    formData.append('descriptionEn', input.descriptionEn ?? '');

    // Pole pliku dokładamy tylko przy faktycznej podmianie - brak pola oznacza
    // dla backendu "zostaw dotychczasowe zdjęcie".
    if (input.photo) {
      formData.append('photo', input.photo);
    }

    return this.http.put<TeamMember>(`${this.apiUrl}/admin/team/${id}`, formData);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/admin/team/${id}`);
  }

  /** Wysyłamy pełną listę w docelowej kolejności, nie pojedyncze przesunięcia. */
  reorder(orderedIds: string[]) {
    return this.http.patch<TeamMember[]>(`${this.apiUrl}/admin/team/order`, orderedIds);
  }
}
