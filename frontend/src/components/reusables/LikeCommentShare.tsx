/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { MessageCircle, Share2, SmilePlus } from 'lucide-react';
import { Button } from '../ui/button';

function LikeCommentShare() {
  const [emojiPanel, setEmojiPanel] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const [reactions, setReactions] = useState<string[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        console.log(emojiPickerRef);
        console.log(emojiPickerRef.current);

        setEmojiPanel(false);
      }
    }

    if (emojiPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [emojiPanel]);

  const updateReactions = (emoji: string) => {
    console.log(reactions);

    setReactions([...reactions, emoji]);
  };

  return (
    <div className='relative z-50 mb-4 flex items-center justify-between'>
      {/* Social media style interaction buttons */}

      <Button
        variant='ghost'
        size='sm'
        className='flex h-auto items-center justify-center rounded-full p-2'
        onClick={() => setEmojiPanel(!emojiPanel)}
      >
        {reactions.length > 0 ? (
          <div className='flex gap-2'>
            <div className='flex items-center justify-center'>{reactions}</div>{' '}
            <div className='rounded-full bg-slate-100 p-1'>
              {' '}
              <SmilePlus size={15} />
            </div>{' '}
          </div>
        ) : (
          <SmilePlus className='text-muted-foreground h-4 w-4' />
        )}
      </Button>

      <Button variant='ghost' size='sm' className='h-auto rounded-full p-2'>
        <MessageCircle className='text-muted-foreground h-4 w-4' />
      </Button>
      <Button variant='ghost' size='sm' className='h-auto rounded-full p-2'>
        <Share2 className='text-muted-foreground h-4 w-4' />
      </Button>
      {emojiPanel && (
        <div className='absolute z-50' ref={emojiPickerRef}>
          <EmojiPicker
            onEmojiClick={(emojiData: EmojiClickData, _event: MouseEvent) => {
              updateReactions(emojiData.emoji);
              setEmojiPanel(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default LikeCommentShare;
