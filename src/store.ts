import { Member } from "./types";
import { STATIC_MEMBERS } from "./members";

export function listMembers(): Member[] {
  return STATIC_MEMBERS;
}

export function getMember(id: string): Member | undefined {
  return STATIC_MEMBERS.find((m) => m.id === id);
}

export function getMemberByRollNumber(rollNumber: string): Member | undefined {
  const normalized = rollNumber.trim().toLowerCase();
  return STATIC_MEMBERS.find(
    (m) => m.rollNumber.trim().toLowerCase() === normalized
  );
}
