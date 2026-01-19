import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface SidebarContent {
  config?: ReactNode;
  tools?: ReactNode;
}

interface SidebarContextValue {
  // Content
  content: SidebarContent;
  setContent: (content: SidebarContent) => void;
  clearContent: () => void;
  hasContent: boolean;

  // Collapsed state
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;

  // Mobile drawer state
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const STORAGE_KEY = 'budget-tracker-sidebar-collapsed';

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Content state
  const [content, setContentState] = useState<SidebarContent>({});

  // Collapsed state (persisted)
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const setContent = useCallback((newContent: SidebarContent) => {
    setContentState(newContent);
  }, []);

  const clearContent = useCallback(() => {
    setContentState({});
  }, []);

  const hasContent = useMemo(() => {
    return !!(content.config || content.tools);
  }, [content]);

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  const value = useMemo(
    () => ({
      content,
      setContent,
      clearContent,
      hasContent,
      isCollapsed,
      setIsCollapsed,
      toggleCollapsed,
      isMobileOpen,
      setIsMobileOpen,
    }),
    [content, setContent, clearContent, hasContent, isCollapsed, setIsCollapsed, toggleCollapsed, isMobileOpen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebarContext = (): SidebarContextValue => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
};
