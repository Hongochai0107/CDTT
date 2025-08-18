// providers/BubbleProvider.tsx
import React, { createContext, useContext, useMemo, useState } from 'react';

type Ctx = { visible: boolean; setVisible: (v: boolean) => void };
const BubbleCtx = createContext<Ctx | null>(null);

export const BubbleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [visible, setVisible] = useState(true);
  const value = useMemo(() => ({ visible, setVisible }), [visible]);
  return <BubbleCtx.Provider value={value}>{children}</BubbleCtx.Provider>;
};

export const useBubble = () => {
  const ctx = useContext(BubbleCtx);
  if (!ctx) throw new Error('useBubble must be used within BubbleProvider');
  return ctx;
};
