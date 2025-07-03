import * as THREE from 'three';
import { useTexture } from '../core/hooks/useTexture';

const StaticImg = ({ imagePath, position, width, height }: { 
    imagePath: string, 
    position: [number, number, number], 
    width: number,
    height: number 
}) => {
    const texture = useTexture(imagePath);

    return (
        <mesh position={position}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={texture} transparent={true} opacity={1} side={THREE.DoubleSide} />
        </mesh>
    );
};

export default StaticImg;