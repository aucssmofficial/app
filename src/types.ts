export interface Member {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  designation: string;
  session: string;
  createdAt: string;
}

export interface MemberInput {
  name: string;
  rollNumber: string;
  department: string;
  designation: string;
  session: string;
}
