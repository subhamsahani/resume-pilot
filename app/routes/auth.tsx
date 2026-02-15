import React, { useEffect } from 'react'
import { useLocation, useNavigate, type NavigateFunction } from 'react-router';
import { usePuterStore } from '~/lib/puter'
export const meta = () => ([
    {title: 'Resumepilot | Auth'},
    {name: 'description', content: 'Log into your account'}
])

const auth = () => {
    const {isLoading, auth} = usePuterStore();
    const location = useLocation();
    const next:string = location.search.split('next=')[1];
    const navigate = useNavigate();


    useEffect(() => {
        if(auth.isAuthenticated) navigate(next);

    }, [auth.isAuthenticated, next])
  
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
        <div className='gradient-border shadow-lg'>
            <section className='flex flex-col gap-8 bg-white rounded-2xl p-10'>
                <div className='flex flex-col items-center gap-2 text-center'>
                    <h1>Welcome</h1>
                    <h2>Log In to Continue Your Job Journey</h2>
                </div>
                <div>
                    {isLoading ? (
                        <button className='auth-button animate-pulse'>
                            <p>Signing you in...</p>
                        </button>
                    ) : (
                        <>
                            {auth.isAuthenticated ? (
                                <button onClick={auth.signOut} className='auth-button'>
                                    <p>Log Out</p>
                                </button>
                            ):(
                                <button onClick={auth.signIn} className='auth-button'>
                                    <p>Log In</p>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    </main>
  )
}

export default auth