import {useFrame, useLoader} from "@react-three/fiber";
import {TextureLoader} from "three";
import { useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const LinkHotspot = ({texturePath, position, onClickBehaviour}: {texturePath: string, position: [number, number, number], onClickBehaviour: () => void}) => {
    const texture = useLoader(TextureLoader, texturePath);
        
    
    const { camera } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const handleHover = () => {
        groupRef.current?.scale.set(1.1, 1.1, 1.1);
    }
    const handleHoverOut = () => {
        groupRef.current?.scale.set(1, 1, 1);
    }
    // Billboarding - always face the camera
    useFrame(() => {
        if (groupRef.current && camera) {
            groupRef.current.lookAt(camera.position);
        }
    });

    return (
        <group ref={groupRef} position={position}>
            <mesh ref={meshRef} onClick={onClickBehaviour} onPointerOver={handleHover} onPointerOut={handleHoverOut}>
                <planeGeometry args={[1.5, 0.5]} />
                <meshBasicMaterial map={texture} transparent={true} opacity={0.9} />
            </mesh>
        </group>
    );
};
export default LinkHotspot;