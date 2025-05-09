import { FC } from 'react'

type Props = {
  number: number
}

export const DownArrow: FC<Props> = ({ number }) => {
  return (
    <div className="flex flex-col justify-center items-center w-full">
      {/* cirlce */}
      <div className="rounded-full border-[2px] w-[32px] h-[32px] flex justify-center items-center text-md">
        {number}
      </div>
      <div className="flex justify-center">
        <div className="border-r-[2px] h-[42px]" />
      </div>
      {/* arrow head */}
      <div
        style={{
          width: '0',
          height: '0',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '12px solid #e0e0e0',
        }}
      ></div>
    </div>
  )
}
