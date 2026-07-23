import React, { useState, useEffect } from 'react';

function Image({
  src,
  alt = "Image Name",
  className = "",
  fallbackSrc = "/assets/images/no_image.png",
  ...props
}) {
  // Initialize with src if available, otherwise go straight to fallback
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  // If the prop changes, reset the internal state
  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}

export default Image;
