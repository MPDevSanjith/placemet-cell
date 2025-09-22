import React from 'react';
import { useTypingEffect } from '../hooks/useTypingEffect';

interface TypingMessageProps {
  content: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
}

const TypingMessage: React.FC<TypingMessageProps> = ({
  content,
  speed = 30,
  delay = 0,
  onComplete,
  className = ''
}) => {
  const { displayedText, isTyping } = useTypingEffect({
    text: content,
    speed,
    delay,
    onComplete
  });

  return (
    <div className={className}>
      <div className="whitespace-pre-wrap text-sm">
        {displayedText}
        {isTyping && (
          <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default TypingMessage;
