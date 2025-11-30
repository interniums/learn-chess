'use client'

import { createAccountAction, loginAction } from '@/actions/auth/auth'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { userSchema } from '@/shared/configs/userSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@/i18n/routing'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ToastContainer, toast } from 'react-toastify'
import { LoaderCircle } from 'lucide-react'

export const SignUpPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [responseError, setResponseError] = useState<string | null>(null)

  const router = useRouter()

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  })

  const {
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = form

  const handleSignUp = useCallback(async () => {
    const email = watch('email')
    const password = watch('password')

    try {
      setIsLoading(true)

      const { error, success } = await createAccountAction({ email, password })

      if (error) {
        toast.error(error)
        setResponseError(error)
        return
      }

      if (success) {
        toast.success('Account successfully created')
        const { error } = await loginAction({ email, password })

        if (!error) {
          return router.push('/wellcome') // Redirect to welcome, not root, as root usually redirects.
        }
      }
    } catch (error) {
      toast.error('Unexpected error')
      console.error(error)
      setResponseError('Unexpected error')
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    if (responseError === 'Email already exists') {
      setError('email', { type: 'custom', message: 'Email already exists' })
    }
  }, [responseError, setError])

  return (
    <div className="flex flex-col h-full justify-center px-[16px] py-[8px]">
      {/* heading */}

      <h1 className="text-center text-2xl font-bold text-(--default-black)">Sign-up</h1>

      <ToastContainer position="top-right" autoClose={5000} hideProgressBar theme="light" closeOnClick />

      {/* inputs */}

      <Form {...form}>
        <form onSubmit={handleSubmit(handleSignUp)}>
          <div className="flex flex-col gap-[16px] px-[24px] py-[24px]">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input id="email" placeholder="Email" autoComplete="off" {...field} aria-invalid={!!errors.email} />
                  </FormControl>
                </FormItem>
              )}
            />
            {errors.email?.message && <p className="-mt-[12px] ml-[4px] text-red-400">{errors.email.message}</p>}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input id="password" type="password" placeholder="Password" {...field} autoComplete="off" />
                  </FormControl>
                </FormItem>
              )}
            />
            {errors.password?.message && <p className="-mt-[12px] ml-[4px] text-red-400">{errors.password.message}</p>}

            <button
              className="w-full bg-(--brown-bg) text-white rounded-md py-2 px-4 shadow-2xl flex items-center justify-center min-h-[40px]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <LoaderCircle className="animate-spin w-[18px] h-[18px]" /> : 'Confirm'}
            </button>
          </div>
        </form>
      </Form>
    </div>
  )
}
