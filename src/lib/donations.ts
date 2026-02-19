// ======================================================
// DONATION HISTORY
// ======================================================
// Add new donations at the TOP of the array.
// They'll appear in order on the donate page.
//
// Format:
//   { name: "Display Name", amount: 99, date: "2026-02-19", message?: "Optional" }
//
// - name: donor's name or alias (use "Anonymous" if unknown)
// - amount: INR value (number)
// - date: YYYY-MM-DD string
// - message: optional thank-you note or donor message
// ======================================================

export interface Donation {
  name: string
  amount: number
  date: string // YYYY-MM-DD
  message?: string
}

export const donations: Donation[] = [
  // ------- Add new donations here ↓ -------
  // { name: "Rahul", amount: 199, date: "2026-02-20", message: "Love the tools!" },
  // { name: "Anonymous", amount: 99, date: "2026-02-19" },
  // -----------------------------------------
]
