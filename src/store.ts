import fs from "fs";
import path from "path";
import { Member, MemberInput } from "./types";
import { v4 as uuidv4 } from "uuid";

const DATA_DIR = path.join(__dirname, "..", "data");
const MEMBERS_FILE = path.join(DATA_DIR, "members.json");

// On Vercel (or when USE_MEMORY_STORE=1), fall back to in-memory storage
const USE_MEMORY =
  process.env.VERCEL === "1" || process.env.USE_MEMORY_STORE === "1";
let memoryMembers: Member[] = [];

function ensureDataDir() {
  if (USE_MEMORY) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(MEMBERS_FILE)) {
    fs.writeFileSync(MEMBERS_FILE, JSON.stringify({ members: [] }, null, 2), {
      encoding: "utf-8",
    });
  }
}

function readMembers(): Member[] {
  if (USE_MEMORY) {
    return memoryMembers;
  }
  ensureDataDir();
  const raw = fs.readFileSync(MEMBERS_FILE, { encoding: "utf-8" });
  const parsed = JSON.parse(raw) as { members: Member[] };
  return parsed.members ?? [];
}

function writeMembers(members: Member[]): void {
  if (USE_MEMORY) {
    memoryMembers = members;
    return;
  }
  ensureDataDir();
  fs.writeFileSync(
    MEMBERS_FILE,
    JSON.stringify({ members }, null, 2),
    { encoding: "utf-8" }
  );
}

export function listMembers(): Member[] {
  return readMembers();
}

export function getMember(id: string): Member | undefined {
  return readMembers().find((m) => m.id === id);
}

export function getMemberByRollNumber(rollNumber: string): Member | undefined {
  const normalized = rollNumber.trim().toLowerCase();
  return readMembers().find(
    (m) => m.rollNumber.trim().toLowerCase() === normalized
  );
}

export function createMember(input: MemberInput): Member {
  const members = readMembers();
  const now = new Date().toISOString();
  const normalizedRoll = input.rollNumber.trim().toLowerCase();

  if (
    members.some(
      (m) => m.rollNumber.trim().toLowerCase() === normalizedRoll
    )
  ) {
    throw new Error("ROLL_NUMBER_EXISTS");
  }

  const member: Member = {
    id: uuidv4(),
    name: input.name.trim(),
    rollNumber: input.rollNumber.trim(),
    department: input.department.trim(),
    designation: input.designation.trim(),
    session: input.session.trim(),
    createdAt: now,
  };
  members.push(member);
  writeMembers(members);
  return member;
}

export function deleteMember(id: string): boolean {
  const members = readMembers();
  const next = members.filter((m) => m.id !== id);
  if (next.length === members.length) {
    return false;
  }
  writeMembers(next);
  return true;
}
