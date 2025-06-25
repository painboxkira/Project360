import React from 'react';
import { Html } from '@react-three/drei';
import Layout from './Rapport/Layout';

interface ActivAIHotspotProps {
  slug: string;
  position: [number, number, number];
  isVisible: boolean;
}

const ActivAIHotspot: React.FC<ActivAIHotspotProps> = ({
  slug,
  position,
  isVisible
}) => {
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Just render the Layout component as an HTML mesh overlay
  return (
    <Html
      position={position}
      fullscreen
      center
    >
      <Layout slug={slug} />
    </Html>
  );
};

export default ActivAIHotspot; 