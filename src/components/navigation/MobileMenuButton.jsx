import React from 'react';
import Icon from '../AppIcon';
import { useSidebar } from './Sidebar';

const MobileMenuButton = () => {
  const { toggleMobile } = useSidebar();

  return (
    <button
      onClick={toggleMobile}
      className="sidebar-toggle"
      aria-label="Toggle navigation menu"
    >
      <Icon name="Menu" size={20} />
    </button>
  );
};

export default MobileMenuButton;