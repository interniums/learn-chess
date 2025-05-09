import { DownArrow } from '@/components/wellcome/DownArrow'
import { ROADMAP } from '@/shared/constants/roadmap'
import { Heart, HeartOff } from 'lucide-react'
import Image from 'next/image'

export const Roadmap = () => {
  return (
    <div className="w-full flex flex-col gap-[16px]">
      <h1 className="text-center text-2xl font-bold">What you learn?</h1>
      {ROADMAP.map((item, index) => (
        <div key={item.title} className="flex flex-col gap-[16px]">
          <DownArrow number={index + 1} />
          <div className="w-full flex flex-col gap-[8px]">
            <h1 className="text-center text-xl font-bold">{item.title}</h1>
            <div className="w-full flex flex-col gap-[4px] justify-center">
              <div className="w-full relative h-[250px]">
                <Image src={item.images[0]} alt="chapter-1-image" fill />
              </div>
              <div className="flex gap-[4px] w-full max-w-screen">
                <Image
                  src={item.images[1]}
                  alt="chapter-1-image"
                  width={1920}
                  height={1080}
                  style={{ width: '48.8%' }}
                />
                <Image src={item.images[2]} alt="chapter-1-image" width={1920} height={1080} style={{ width: '50%' }} />
              </div>
            </div>
            <div>
              <p>{item.description}</p>
            </div>
            <div className="flex justify-between px-[8px] pt-[8px]">
              <div className="flex items-center gap-[16px]">
                {/* like lesoon */}
                <div className="flex flex-col gap-[3px] items-center justify-center">
                  <Heart />
                  <span className="text-xs">{item.likes}</span>
                </div>

                {/* dislike lesson */}
                <div className="flex flex-col gap-[3px] items-center justify-center">
                  <HeartOff />
                  <p className="text-xs">{item.dislikes}</p>
                </div>
              </div>
              <button className="shadow-lg text-md font-semibold py-1 px-6 rounded-md text-cyan-50 bg-(--brown-bg)">
                Learn
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
