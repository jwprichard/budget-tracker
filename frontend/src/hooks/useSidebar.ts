import { useEffect, ReactNode } from 'react';
import { useSidebarContext } from '../contexts/SidebarContext';

interface UseSidebarOptions {
  config?: ReactNode;
  tools?: ReactNode;
}

/**
 * Hook for pages to provide sidebar content.
 * Content is automatically cleared when the component unmounts.
 *
 * @example
 * ```tsx
 * const MyPage = () => {
 *   useSidebar({
 *     config: <MyFilters />,
 *     tools: <MyTools />
 *   });
 *
 *   return <MyContent />;
 * };
 * ```
 */
export const useSidebar = (options: UseSidebarOptions): void => {
  const { setContent, clearContent } = useSidebarContext();

  useEffect(() => {
    setContent({
      config: options.config,
      tools: options.tools,
    });

    return () => {
      clearContent();
    };
  }, [options.config, options.tools, setContent, clearContent]);
};

/**
 * Hook to access sidebar state and controls.
 * Use this when you need to programmatically control the sidebar.
 */
export const useSidebarControls = () => {
  const { isCollapsed, setIsCollapsed, toggleCollapsed, isMobileOpen, setIsMobileOpen, hasContent } =
    useSidebarContext();

  return {
    isCollapsed,
    setIsCollapsed,
    toggleCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    hasContent,
  };
};
