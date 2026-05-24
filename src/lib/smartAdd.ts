/** Whether Smart Add (Groq parse) is configured on the server. */
export function isSmartAddEnabled(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim())
}
