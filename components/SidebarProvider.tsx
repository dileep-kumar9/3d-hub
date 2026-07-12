"use client";

import { createContext, useContext, useState, ReactNode } from "react";

const SidebarContext = createContext({
  open: false,
  toggle: () => {},
  close: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        open,
        toggle: () => setOpen((prev) => !prev),
        close: () => setOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
