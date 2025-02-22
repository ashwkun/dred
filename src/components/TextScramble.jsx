import React, { useEffect, useState } from 'react';

const chars = '!<>-_\\/[]{}—=+*^?#________';

function TextScramble({ text, isAnimating }) {
  const [displayText, setDisplayText] = useState('');
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (!isAnimating) {
      setDisplayText('');
      return;
    }

    const finalText = text;
    let frame = 0;
    let frameRequest;
    let queue = [];

    for (let i = 0; i < finalText.length; i++) {
      queue.push({
        from: chars[Math.floor(Math.random() * chars.length)],
        to: finalText[i],
        start: Math.floor(Math.random() * 40),
        end: Math.floor(Math.random() * 40) + 20
      });
    }

    const update = () => {
      let output = '';
      let complete = 0;
      
      for (let i = 0, n = queue.length; i < n; i++) {
        let { from, to, start, end } = queue[i];
        
        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          output += chars[Math.floor(Math.random() * chars.length)];
        } else {
          output += from;
        }
      }

      setDisplayText(output);

      if (complete === queue.length) {
        cancelAnimationFrame(frameRequest);
      } else {
        frame++;
        frameRequest = requestAnimationFrame(update);
      }
    };

    frameRequest = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameRequest);
    };
  }, [text, isAnimating, counter]);

  // Restart animation
  const restart = () => {
    setCounter(c => c + 1);
  };

  return (
    <span className="font-mono">{displayText}</span>
  );
}

export default TextScramble; 