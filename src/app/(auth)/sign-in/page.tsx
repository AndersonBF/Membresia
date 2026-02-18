"use client";

import * as Clerk from '@clerk/elements/common'
import * as SignIn from '@clerk/elements/sign-in'
import Image from "next/image";
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Sign } from 'crypto'
import { useEffect } from 'react';

const LoginPage = () => {

      const { isLoaded, isSignedIn, user } = useUser();

  const router = useRouter();

      useEffect(() => {
  if (isSignedIn && isLoaded && user) {
    router.push("/admin")
  }
}, [user, router, isLoaded, isSignedIn])
      
  return (
    <div className='h-screen flex items-center justify-center bg-green-800'>
        <SignIn.Root>
          <p className='text-xs text-center text-gray-600'>
  Não tem conta?{' '}
  <a href="/sign-up" className='text-green-700 font-semibold'>Cadastre-se</a>
</p>
          <SignIn.Step 
          name='start' className='bg-green-200 p-12 rounded-md shadow-2xl flex flex-col gap-2'>
            <h1 className='text-3xl font-bold flex items-center '>
              {/*<Image src="/logo.png" alt="" width={24} height={24}/>*/}
              Membresia
            </h1>
            
            <h2 className='text-gray-800'> Logue em sua conta</h2>
            <Clerk.GlobalError className='text-sm text-red-400'/>
            <Clerk.Field name="identifier" className='flex flex-col gap-2'>
              <Clerk.Label className='text-xs text-gray-500'>Username</Clerk.Label>
              <Clerk.Input 
              type="text" 
              required
              className='p-2 rounded-md ring-1 ring-gray-300'
              />
              <Clerk.FieldError className='text-xs text-red-400'/>
            </Clerk.Field>
            <Clerk.Field name="password" className='flex flex-col gap-2'>
              <Clerk.Label className='text-xs text-gray-500'>Senha</Clerk.Label>
              <Clerk.Input type="password" required className='p-2 rounded-md ring-1 ring-gray-300'/>
              <Clerk.FieldError className='text-xs text-red-400'/>
            </Clerk.Field>
            <SignIn.Action submit className='bg-green-700 text-white my-1 rounded-md text-sm p-[10px]'>Entre</SignIn.Action>
          </SignIn.Step>
        </SignIn.Root>

    </div>
  )
}

export default LoginPage