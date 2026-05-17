// Real users and boards are created via the app: sign up at /signup, then click
// "Create board" on the boards index. The Postgres trigger in
// 20260516120100_supabase_auth_trigger mirrors auth.users into public."User".
async function main() {
  // No-op. Kept so `npm run seed` and `prisma migrate reset` (which runs seed)
  // both exit cleanly.
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
