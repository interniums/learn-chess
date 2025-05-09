type Roadmap = {
  title: string
  description: string
  images: string[]
  likes: number
  dislikes: number
}

export const ROADMAP: Roadmap[] = [
  {
    title: 'First steps',
    description:
      'In this chapter, you`ll discover the art of elegant checkmates and transforming pawns into queens. Explore pawn endings, learn how middlegame positions lead to victory, and uncover the value of each piece. Master the opening, control the center, and develop the skill to recognize and avoid (or set) traps. Let the journey begin.',
    images: [
      '/images/wellcome/roadmap/pieces-moves.webp',
      '/images/wellcome/roadmap/relative-strength.webp',
      '/images/wellcome/roadmap/pawn-promotion.webp',
    ],
    likes: 1212,
    dislikes: 19,
  },
  {
    title: 'Endgame core concepts',
    description:
      'In this chapter, you`ll learn key endgame principles, from classical endings to creating passed pawns. Master the opposition, understand the knight-bishop value, and discover how to checkmate with a knight and bishop. Explore the queen versus rook endgame and sharpen your overall strategy. Let’s continue your journey to chess mastery.',
    images: [
      '/images/wellcome/roadmap/endgame-principles.webp',
      '/images/wellcome/roadmap/knight-bishop.webp',
      '/images/wellcome/roadmap/king-opposition.webp',
    ],
    likes: 399932,
    dislikes: 123,
  },
]
