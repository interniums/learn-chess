'use server'
import { WellcomePage } from '@/pages/wellcome/WellcomePage'
import { createClient } from '@/supabase/server'

export default async function Wellcome() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  return <WellcomePage user={Boolean(data.user)} />
}
