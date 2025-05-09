import { z } from 'zod'

export const userSchema = z.object({
  email: z.string().min(6, 'Email must be at least 6 characters long').email('Invalid email adress'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})
