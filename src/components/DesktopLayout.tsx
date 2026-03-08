import { ReactNode } from "react";

interface DesktopLayoutProps {
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

/** Wraps page content in a centered container for desktop, full-width on mobile */
const DesktopLayout = ({ children, maxWidth = "max-w-lg", className = "" }: DesktopLayoutProps) => (
  <div className={`mx-auto w-full ${maxWidth} ${className}`}>
    {children}
  </div>
);

export default DesktopLayout;
