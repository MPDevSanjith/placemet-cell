import { useState, useEffect } from 'react';

interface UseTypingEffectOptions {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export function useTypingEffect({ 
  text, 
  speed = 30, 
  delay = 0, 
  onComplete 
}: UseTypingEffectOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      setCurrentIndex(0);
      return;
    }

    // Reset when text changes
    setDisplayedText('');
    setIsTyping(true);
    setCurrentIndex(0);

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex >= text.length) {
            clearInterval(interval);
            setIsTyping(false);
            onComplete?.();
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay, onComplete]);

  useEffect(() => {
    setDisplayedText(text.slice(0, currentIndex));
  }, [text, currentIndex]);

  return { displayedText, isTyping };
}
