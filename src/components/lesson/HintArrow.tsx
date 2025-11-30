/**
 * Arrow overlay for showing move hints
 */

interface HintArrowProps {
  coords: { x1: number; y1: number; x2: number; y2: number }
}

export const HintArrow = ({ coords }: HintArrowProps) => {
  const { x1, y1, x2, y2 } = coords

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-15 animate-in fade-in duration-300"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="3"
          markerHeight="5"
          refX="2.5"
          refY="2.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 3 2.5, 0 5" fill="#8b4513" />
        </marker>
      </defs>
      <line
        x1={`${x1}%`}
        y1={`${y1}%`}
        x2={`${x2}%`}
        y2={`${y2}%`}
        stroke="#8b4513"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
        strokeLinecap="butt"
        className="drop-shadow-lg"
      />
    </svg>
  )
}
