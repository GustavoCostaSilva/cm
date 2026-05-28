import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { StaffShell } from '@/components/staff/StaffShell'
import { OfficeSettingsForm } from '@/components/staff/OfficeSettingsForm'

export default async function ConfigPage() {
  const session = await getStaffSession()
  if (!session || session.role !== 'coordenador') redirect('/gestao/clientes')

  const office = await db.office.get()

  return (
    <StaffShell staffName={session.name} role={session.role}>
      <OfficeSettingsForm office={office} />
    </StaffShell>
  )
}
