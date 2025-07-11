"use client"

import type React from "react"

import { Input } from "@/components/ui/input"

interface SearchInputProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  handleSearch: (e: React.FormEvent) => void
}

export function SearchInput({ searchTerm, setSearchTerm, handleSearch }: SearchInputProps) {
  return (
    <form onSubmit={handleSearch} className="mb-4 w-full max-w-[100%] overflow-x-hidden">
      <Input
        type="text"
        placeholder="Search for movies, series, users, etc..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full max-w-[100%] text-xs sm:text-sm md:text-base box-border px-3 sm:px-3 lg:px-4 appearance-none"
        aria-label="Search for movies, series, users, etc"
      />
    </form>
  )
}
