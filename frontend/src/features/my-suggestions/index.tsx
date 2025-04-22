/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomTabsList } from '@/components/layout/CustomTabsList'
import MySuggestionCard from '@/components/layout/MySuggestionCard' 
import { mockMySuggestions } from '@/components/layout/data/mySuggestions'
import SuggestionFlow from '@/components/suggestions/SuggestionFlow'

const MySuggestions = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [isSuggestionFlowOpen, setIsSuggestionFlowOpen] = useState(false)
  useEffect(() => {
    console.log('activeTab', activeTab)
  }, [activeTab])

  const filteredSuggestions =
    activeTab === 'all'
      ? mockMySuggestions
      : mockMySuggestions.filter((item) => item.type === activeTab)

  const handleSuggestionComplete = (data: any) => {
    console.log('Suggestion completed:', data)
    setIsSuggestionFlowOpen(false)
    // In a real app, this would send the suggestion to the backend
  }

  return (
    <>
      <main className='mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8'>
        <div className='py-6'>
          <div className='mb-8 flex items-center justify-between'>
            <h1 className='text-foreground text-3xl font-bold'>
              My <span className='text-primary'>Suggestions</span>
            </h1>
            <Button
              onClick={() => setIsSuggestionFlowOpen(true)}
              className='gap-2 rounded-full'
            >
              <Plus className='h-4 w-4' />
              New Suggestion
            </Button>
          </div>

          <CustomTabsList
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filteredSuggestions={filteredSuggestions}
            CustomCard={MySuggestionCard}
            handleMarkAsWatched={() => {}}
            handleMarkAsWatching={() => {}}
            handleAddToWatchlist={() => {}}
            handleRemoveFromMyWatchList={() => {}}
          />
        </div>
      </main>

      <SuggestionFlow
        open={isSuggestionFlowOpen}
        onOpenChange={setIsSuggestionFlowOpen}
        onComplete={handleSuggestionComplete}
      />
  </>
  )
}

export default MySuggestions
