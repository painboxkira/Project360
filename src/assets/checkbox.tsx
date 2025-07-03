import { useState, useRef, useMemo } from "react";
import * as THREE from "three";

interface Checkbox3DProps {
    checked: boolean;
    onToggle?: () => void;
    position?: [number, number, number];
    scale?: number;
    checkedColor?: string;
    checkedBorderColor?: string;
    uncheckedColor?: string;
    uncheckedBorderColor?: string;
    hoverColor?: string;
    checkmarkColor?: string;
}

export default function Checkbox3D({ 
    checked, 
    onToggle, 
    position = [0, 0, 0], 
    scale = 1,
    checkedColor = "#4A90E2",
    checkedBorderColor = "#2E5BBA",
    uncheckedColor = "#ffffff",
    uncheckedBorderColor = "#B8C5D6",
    hoverColor = "#E8F4FD",
    checkmarkColor = "#ffffff"
}: Checkbox3DProps) {
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Create texture for the checkbox state
    const texture = useMemo(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 100;
        canvas.height = 100;
        
        if (!ctx) return new THREE.CanvasTexture(canvas);
        
        // Draw background square with rounded corners
        ctx.fillStyle = checked ? checkedColor : (hovered ? hoverColor : uncheckedColor);
        ctx.strokeStyle = checked ? checkedBorderColor : uncheckedBorderColor;
        ctx.lineWidth = 3;
        
        // Create rounded rectangle path
        const radius = 8;
        const x = 5;
        const y = 5;
        const width = 90;
        const height = 90;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();
        
        // Draw checkmark if checked
        if (checked) {
            ctx.strokeStyle = checkmarkColor;
            ctx.lineWidth = 8;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(25, 50);
            ctx.lineTo(40, 65);
            ctx.lineTo(75, 35);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }, [checked, hovered, checkedColor, checkedBorderColor, uncheckedColor, uncheckedBorderColor, hoverColor, checkmarkColor]);
    
    return (
        <mesh
            ref={meshRef}
            position={position as [number, number, number]}
            scale={[scale * (hovered ? 1.1 : 1), scale * (hovered ? 1.1 : 1), scale]}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                setHovered(false);
                document.body.style.cursor = 'auto';
            }}
            onClick={(e) => {
                e.stopPropagation();
                onToggle && onToggle();
            }}
        >
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
                map={texture}
                transparent={true}
                opacity={1}
            />
        </mesh>
    );
}