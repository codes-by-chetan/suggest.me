import { ParsedLocation, redirect } from '@tanstack/react-router'

export const getAccessToken = () => {
  return localStorage.getItem('token')
}

export const setAccessToken = (token: string) => {
  localStorage.setItem('token', token)
}

export const removeAccessToken = () => {
  localStorage.removeItem('token')
}

export const isAuthenticated = () => {
  return !!getAccessToken()
}

export const redirectIfNotAuthenticated = async ({
  location,
}: {
  location: ParsedLocation
}) => {
  if (!isAuthenticated()) {
    throw redirect({
      to: '/sign-in',
      search: {
        redirect: location.href,
      },
    })
  }
}
