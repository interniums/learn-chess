import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { useRouter, Link } from '@/i18n/routing'
import { toast } from 'react-toastify'
import Image from 'next/image'
import { createClient as createBrowserSupabaseClient } from '@/supabase/client'

type Props = {
  isOpen: boolean
  onOpen: Dispatch<SetStateAction<boolean>>
  firstLessonPath?: string
}

export const GetStartedModal: FC<Props> = ({ isOpen, onOpen, firstLessonPath }) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleShadowLogin = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const supabase = await createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInAnonymously()

      if (error) {
        toast.error(error.message ?? 'Unable to start anonymous session')
        setIsLoading(false)
        return
      }

      // Redirect to first lesson after anonymous login
      const redirectPath = firstLessonPath || '/wellcome'
      router.push(redirectPath)
    } catch (err) {
      console.error('Anonymous login error:', err)
      toast.error('Unexpected error while starting anonymous session')
      setIsLoading(false)
    }
  }, [isLoading, router, firstLessonPath])

  return (
    <Dialog open={isOpen} onOpenChange={onOpen}>
      <DialogContent className="w-[341px]">
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>
            Create an account to sync your progress across devices, or continue without an account to save your
            progress anonymously on this device.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-[24px] items-center w-full relative">
          <div className="relative w-full h-[293px]">
            <Image src="/images/wellcome/modal/piece-invites.webp" fill alt="piece-ivites" className="rounded-md" />
          </div>
          <div className="flex flex-col gap-[12px] pt-[8px]">
            <Link href="/sign-up">
              <button
                disabled={isLoading}
                className="shadow-lg text-md font-semibold py-2 px-6 rounded-md text-white bg-(--brown-bg) w-full"
              >
                Create an account
              </button>
            </Link>
            <Link href="/sign-in">
              <button
                disabled={isLoading}
                className="shadow-lg text-md font-semibold py-2 px-6 rounded-md text-white bg-(--brown-bg) w-full"
              >
                Already have an account?
              </button>
            </Link>
          </div>
          <div onClick={handleShadowLogin} className="cursor-pointer">
            <p className="text-center underline text-(--disabled)">Continue to lesson without account</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
