import { redirect } from 'next/navigation'
import { getStaffSession } from '@/lib/server-session'
import { StaffLoginForm } from '@/components/staff/StaffLoginForm'

export default async function StaffLoginPage() {
  const session = await getStaffSession()
  if (session) redirect(session.role === 'coordenador' ? '/gestao/painel' : '/gestao/clientes')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a1f44] via-[#13294f] to-[#1b3a6b] p-4">
      <StaffLoginForm />
    </div>
  )
}
