export interface TeamMember {
  id: string;
  fullName: string;
  description: string;
  photoUrl: string;
  photoContentType: string;
  photoSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberInput {
  fullName: string;
  description: string;
  photo: File;
}
