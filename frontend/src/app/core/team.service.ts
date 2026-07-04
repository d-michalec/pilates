import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { CreateTeamMemberInput, TeamMember } from './team-member';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly apiUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  list() {
    return this.http.get<TeamMember[]>(`${this.apiUrl}/team`);
  }

  create(input: CreateTeamMemberInput) {
    const formData = new FormData();
    formData.append('fullName', input.fullName);
    formData.append('description', input.description);
    formData.append('photo', input.photo);

    return this.http.post<TeamMember>(`${this.apiUrl}/admin/team`, formData);
  }
}
