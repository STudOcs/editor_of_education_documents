export interface UserProfile {
  last_name: string;
  first_name: string;
  middle_name: string;
  group_name: string;
  student_card: string;
  department: string;
  email: string;
}

export interface UpdateProfileDto extends Partial<UserProfile> {
  password?: string;
}
