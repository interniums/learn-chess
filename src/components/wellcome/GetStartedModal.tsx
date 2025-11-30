import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { anonymousLoginAction } from '@/actions/auth/auth'
import { useRouter, Link } from '@/i18n/routing'
import { toast } from 'react-toastify'
import Image from 'next/image'

type Props = {
  isOpen: boolean
  onOpen: Dispatch<SetStateAction<boolean>>
}

export const GetStartedModal: FC<Props> = ({ isOpen, onOpen }) => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleShadowLogin = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)
    const { success, error } = await anonymousLoginAction()

    if (error) {
      setIsLoading(false)
      toast.error(error)
      return
    }

    if (success) {
      // NOTE: We could also pass this path from props if we want it dynamic
      // For now, if user success, the page might re-render or we force navigation
      // But since we are client side, we need to know WHERE to go.
      // Ideally we refresh wellcome page and let it handle the redirect?
      // Or just hardcode fallback for now and let user click 'Start Learning' again if they prefer.
      // But better UX is direct redirect.
      return router.push('/wellcome') // Redirecting to wellcome will trigger the "user exists" logic if we click button?
      // Actually, if we redirect to /wellcome, the server component re-runs, finds user, passes user=true.
      // But the user is still on the same page visually.
      // Let's redirect to the first lesson directly if possible, or reload.
      // router.refresh() might work, but let's push to wellcome to be safe.
    }
    setIsLoading(false)
  }, [isLoading, router])

  return (
    <Dialog open={isOpen} onOpenChange={onOpen}>
      <DialogContent className="w-[341px]">
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>Only users with an account able to save their progress.</DialogDescription>
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
