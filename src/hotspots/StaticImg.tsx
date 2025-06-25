import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

const StaticImg = ({ imagePath, position, width, height }: { 
    imagePath: string, 
    position: [number, number, number], 
    width: number,
    height: number 
}) => {
    const texture = useLoader(THREE.TextureLoader, imagePath);

    return (
        <mesh position={position}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={texture} transparent={true} opacity={1} side={THREE.DoubleSide} />
        </mesh>
    );
};

export default StaticImg;