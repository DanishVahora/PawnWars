import React, { createContext, useState, ReactNode } from "react";

type PlayerColor = "white" | "black";

interface PlayerColorContextProps {
  playerColor: PlayerColor;
  setPlayerColor: (color: PlayerColor) => void;
}

export const PlayerColorContext = createContext<PlayerColorContextProps>({
  playerColor: "white",
  setPlayerColor: () => {},
});

export const PlayerColorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");

  return (
    <PlayerColorContext.Provider value={{ playerColor, setPlayerColor }}>
      {children}
    </PlayerColorContext.Provider>
  );
};
