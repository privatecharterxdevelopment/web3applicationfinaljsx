import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
}

export default function Portal({ children, containerId = 'modal-root' }: PortalProps) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create or get the modal container
    let modalRoot = document.getElementById(containerId);
    
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = containerId;
      modalRoot.style.position = 'relative';
      modalRoot.style.zIndex = '9999';
      document.body.appendChild(modalRoot);
    }

    setContainer(modalRoot);

    // Cleanup function
    return () => {
      // Don't remove the container as other portals might be using it
      // It will be cleaned up when the page unloads
    };
  }, [containerId]);

  // Don't render anything until we have a container
  if (!container) {
    return null;
  }

  return createPortal(children, container);
}