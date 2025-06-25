import {useFrame, useLoader, useThree} from "@react-three/fiber";
import { useRef, useState } from "react";
import {TextureLoader} from "three";
import * as THREE from "three";

const IntroHotspot = ({
    texturePath, 
    position, 
    onComplete
}: {
    texturePath: [string,string], 
    position: [number, number, number],
    onComplete?: () => void
}) => {
    const texture = useLoader(TextureLoader, texturePath[0]);
    const texture2 = useLoader(TextureLoader, texturePath[1]);
    const groupRef = useRef<THREE.Group>(null);
    const playbuttonRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();
    const [clicked, setClicked] = useState(false);
    const handleHover = () => {
        
        playbuttonRef.current?.scale.set(clicked ? 0 : 1.1, clicked ? 0 : 1.1, clicked ? 0 : 1.1);
    }
    const handleHoverOut = () => {
        playbuttonRef.current?.scale.set(clicked ? 0 : 1, clicked ? 0 : 1, clicked ? 0 : 1);
    }
    const handleClick = () => {
        setClicked(true);
        groupRef.current?.scale.set(0, 0, 0);
        playbuttonRef.current?.scale.set(0, 0, 0);
        // Call onComplete when intro is finished
        onComplete?.();
    };

    // Billboarding - always face the camera
    useFrame(() => {
        if (groupRef.current && camera) {
            groupRef.current.lookAt(camera.position);
        }
        if (playbuttonRef.current && camera) {
            playbuttonRef.current.lookAt(camera.position);
        }
    });

    return (
        <>
        {/* Main intro texture */}
        <mesh ref={groupRef} position={position}>
            <planeGeometry args={[2, 0.75]} />
            <meshBasicMaterial 
                map={texture} 
                transparent={true} 
                opacity={1.0}
                side={THREE.DoubleSide}
                alphaTest={0.5}
                toneMapped={false}
            />
        </mesh>
        
        {/* Play button - positioned slightly in front of the main texture */}
        <mesh 
            ref={playbuttonRef} 
            onPointerOver={handleHover} 
            onPointerOut={handleHoverOut} 
            onClick={handleClick} 
            position={[position[0], position[1] -0.5, position[2] + 0.2]}
        >
            <circleGeometry args={[0.2, 32]} />
            <meshBasicMaterial 
                map={texture2} 
                transparent={true} 
                opacity={1.0}
                side={THREE.DoubleSide}
                alphaTest={0.5}
                toneMapped={false}
            />
        </mesh>
        </>
    );
};

export default IntroHotspot;