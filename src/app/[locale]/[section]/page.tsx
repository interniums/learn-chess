'use server'

import { SectionPage } from '@/pages/section/SectionPage'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  params: Promise<Record<string, string>>
}

export default async function Section({ searchParams, params }: Props) {
  const { section } = await params

  return <SectionPage />
}
