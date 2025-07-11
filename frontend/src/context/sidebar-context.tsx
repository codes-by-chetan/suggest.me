import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarContextType = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};
