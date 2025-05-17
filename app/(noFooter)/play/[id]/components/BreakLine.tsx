import React, { memo } from 'react';

interface BreakLineProps {
  count: number;
}

const BreakLine = memo(({ count }: BreakLineProps) => {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <br key={i} />
      ))}
    </>
  );
});

BreakLine.displayName = 'BreakLine';

export default BreakLine;
