import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import {useState} from "react";


const InfoPerson = ({texturePath,position}:{texturePath:[string,string,string],position:THREE.Vector3}) => {
    const texture1 = useLoader(THREE.TextureLoader, texturePath[0]);
    const texture2 = useLoader(THREE.TextureLoader, texturePath[1]);
    const texture3 = useLoader(THREE.TextureLoader, texturePath[2]);
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [isOpen, setIsOpen] = useState(false);


    const handleClick = () => {
        setIsClicked(!isClicked);
        setIsOpen(!isOpen);
    }

    const handleMouseEnter = () => {
        setIsHovered(true);
    }
    const handleMouseLeave = () => {
        setIsHovered(false);
    }



    const hotspot = (
        <mesh position={position} scale={isHovered ? 1.2 : 1}>
            <circleGeometry args={[0.2, 64]} />
            <meshBasicMaterial map={texture1} transparent={true} opacity={1} />
        </mesh>
    )

    const info = (
        
            <mesh position={[position.x,position.y,position.z]} scale={isHovered ? 1.2 : 1}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={texture2} transparent={true} opacity={1} side={THREE.DoubleSide} />
        </mesh>
    )
    const title = (
        <mesh position={[position.x,position.y,position.z]} scale={isHovered ? 1.2 : 1}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={texture3} transparent={true} opacity={1} side={THREE.DoubleSide} color={"white"} />
        </mesh>
    )

    return (
        <group>
            {hotspot}
            {info}
            {title}
        </group>
    )
}
export default InfoPerson;