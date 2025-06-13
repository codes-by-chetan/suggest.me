import { ParsedLocation, redirect } from '@tanstack/react-router'

export const getAccessToken = () => {
  return localStorage.getItem('accessToken')
}

export const setAccessToken = (token: string) => {
  localStorage.setItem('accessToken', token)
}

export const removeAccessToken = () => {
  localStorage.removeItem('accessToken')
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
