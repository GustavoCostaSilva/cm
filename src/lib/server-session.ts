import { cookies } from 'next/headers'
import {
  verifyStaff,
  verifyClient,
  STAFF_COOKIE,
  CLIENT_COOKIE,
  type StaffSession,
  type ClientSession,
} from './session'

// Server-side session readers for server components and route handlers.
export async function getStaffSession(): Promise<StaffSession | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value
  return token ? verifyStaff(token) : null
}

export async function getClientSession(): Promise<ClientSession | null> {
  const token = (await cookies()).get(CLIENT_COOKIE)?.value
  return token ? verifyClient(token) : null
}
