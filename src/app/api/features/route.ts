import { ok } from '@/lib/api'
import { isSmartAddEnabled } from '@/lib/smartAdd'

export async function GET() {
  return ok({ smartAdd: isSmartAddEnabled() })
}
