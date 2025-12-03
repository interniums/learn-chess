'use client'

import { Roadmap } from '@/components/wellcome/Roadmap'
import { useCallback, useMemo } from 'react'
import { GetStartedModal } from '@/components/wellcome/GetStartedModal'
import { useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

type Props = {
  user: boolean
  firstLessonPath: string
}

export const WellcomePage = ({ user, firstLessonPath }: Props) => {
  const query = useSearchParams()
  const router = useRouter()

  const modal = useMemo(() => {
    const modal = query?.get('modal')

    // if user modal shouldnt be open
    return modal && !user
  }, [query, user])

  const handleToggleGetStartedModal = useCallback(() => {
    // if session exists dont open modal and redirect to lesson
    if (user) {
      return router.push(firstLessonPath)
    }

    // if no session open modal
    const url = modal ? '/wellcome' : '/wellcome?modal=true'
    router.replace(url, { scroll: false })
  }, [modal, router, user, firstLessonPath])

  return (
    <>
      {/* get started modal */}
      <GetStartedModal isOpen={!!modal} onOpen={handleToggleGetStartedModal} firstLessonPath={firstLessonPath} />

      <div className="flex flex-col items-center flex-1 h-full pt-[70px]">
        {/* header */}

        <header className="w-full min-h-[70px] px-[16px] fixed top-0 items-center flex z-20 bg-white">
          <div className="flex gap-[8px] items-center w-full">
            <Image src="/images/header/rook.webp" alt="king" width={48} height={48} />
            <p className="text-2xl underline">Chess Academy</p>
          </div>
          <div className="flex justify-end h-full">{user ? 'session' : 'no session'}</div>
        </header>
        {/* main section */}

        <main className="w-full">
          {/* image */}

          <div className="w-full h-[250px] relative">
            <Image src="/images/wellcome/capablanca-ai.webp" alt="Jose Raul capablanca" fill priority />
          </div>
          {/* heading */}

          <div className="px-[16px] py-[8px]">
            <h1 className="text-xl">
              <span className="font-bold text-2xl">Learn chess</span> <br />
              with Chess Fundamentals <br /> by Jose Raul Capablanca
            </h1>
          </div>
          <div className="px-[20px] py-[40px]">
            {/* get started button */}

            <div className="w-full flex justify-center">
              <button
                onClick={handleToggleGetStartedModal}
                className="py-[8px] px-[16px] border rounded-[2px] w-[185px] h-[50px] relative z-10 bg-slate-50"
              >
                <div className="absolute border rounded-[2px] w-[185px] h-[50px] left-[-8px] top-[-6px] z-0" />
                <p className="text-xl font-bold">Start Learning</p>
              </button>
            </div>
            {/* about */}

            <div className="w-full py-[40px] flex flex-col gap-[8px]">
              <h1 className="text-2xl font-bold text-center">About</h1>
              <p className="text-md">
                Chess Academy is a free, interactive web platform based on the iconic book{' '}
                <span className="font-bold">&quot;Chess Fundamentals&quot;</span> by José Raúl Capablanca. This book
                provides an essential chess learning experience, especially designed for beginners. As you progress,
                you’ll solve engaging chess problems that help reinforce key concepts, making it easier to retain the
                material and improve your game
              </p>
            </div>
            {/* roadmap */}

            <Roadmap />
          </div>
        </main>
      </div>
    </>
  )
}
