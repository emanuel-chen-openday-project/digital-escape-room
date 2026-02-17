const ADMIN_EMAILS: string[] = [
  "emanu6788@gmail.com",
  "chenemanu888@gmail.com",
  "chenbayazi123@gmail.com",
  "inessaai@jce.ac.il",
  "pinida@jce.ac.il",
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
