import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { anonymousLoginAction } from '@/actions/auth/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import Link from 'next/link'
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
      return router.push('/first-principles/simple-mates?anonymous=true')
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
          <div onClick={handleShadowLogin}>
            <p className="text-center underline text-(--disabled)">Continue to lesson without account</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
