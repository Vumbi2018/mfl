import React from 'react';
import * as LucideIcons from 'lucide-react';
// import { HelpCircle } from 'lucide-react'; // Removed to avoid import error if deprecated

function Icon({
    name,
    size = 24,
    color = "currentColor",
    className = "",
    strokeWidth = 2,
    ...props
}) {
    const IconComponent = LucideIcons?.[name];

    if (!IconComponent) {
        // Fallback to CircleHelp or HelpCircle (legacy) or a generic circle
        const FallbackIcon = LucideIcons?.CircleHelp || LucideIcons?.HelpCircle || LucideIcons?.Circle;

        if (FallbackIcon) {
            return <FallbackIcon size={size || 24} color={color || "gray"} strokeWidth={strokeWidth || 2} className={className || ""} {...props} />;
        }
        return <span style={{ width: size, height: size, display: 'inline-block', background: '#ccc', borderRadius: '50%' }} />;
    }

    return <IconComponent
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        className={className}
        {...props}
    />;
}
export default Icon;