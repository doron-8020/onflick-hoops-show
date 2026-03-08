import { createContext, useContext, useState, ReactNode } from "react";

interface MuteContextType {
  globalMuted: boolean;
  setGlobalMuted: (muted: boolean) => void;
}

const MuteContext = createContext<MuteContextType>({ globalMuted: true, setGlobalMuted: () => {} });

export const MuteProvider = ({ children }: { children: ReactNode }) => {
  const [globalMuted, setGlobalMuted] = useState(true);
  return (
    <MuteContext.Provider value={{ globalMuted, setGlobalMuted }}>
      {children}
    </MuteContext.Provider>
  );
};

export const useMute = () => useContext(MuteContext);
