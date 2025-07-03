import * as THREE from "three";
import { useMemo, useRef, useState } from "react";
import { useTextureArrayWithFallbacks, useTextures } from "../core/hooks/useTexture";


interface Choice {
    id: string;
    texture: string;
    isCorrect: boolean;
}   

function checkTexturePath(texturePath: string[]) {
    if (texturePath.length !== 3) {
        throw new Error("Texture path must be an array of exactly 3 strings: [initial, completed, feedback]");
    }
    
    return texturePath;
}

const QCUhotspot = ({texturePath, position, onComplete, choices, onActivate, isActive = false, onSetActive, onSetInactive}: {
    texturePath: string[], 
    position: [number, number, number], 
    onComplete: () => void, 
    choices: Choice[],
    onActivate?: () => void,
    isActive?: boolean,
    onSetActive?: () => void,
    onSetInactive?: () => void
}) => {

    const checkedTexturePath = checkTexturePath(texturePath);

    const [isHovered, setIsHovered] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isIncorrect, setIsIncorrect] = useState(false);
    const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [hoveredChoiceIndex, setHoveredChoiceIndex] = useState<number | null>(null);
    
    const groupRef = useRef<THREE.Group>(null);
  
    const tooltipConfig = choices.map((choice) => {
        return {
            texture: choice.texture,
        };
    });
    

    // Load textures from global cache with fallbacks
    const textures = useTextureArrayWithFallbacks(checkedTexturePath, [
        "/textures/questiondef.png",
        "/textures/complete.png",
        "/textures/feedback.png"
    ]);

    const [initialTexture, completedTexture, feedbackTexture] = textures;
    
    const choicesTextures = useTextures(choices.map(choice => choice.texture));

    const handleChoiceSelect = (choice: Choice) => {
        setSelectedChoice(choice);
        
        if (choice.isCorrect) {
            setIsCorrect(true);
            setIsIncorrect(false);
            // Complete immediately for correct answers
            setTimeout(() => {
                setIsCompleted(true);
                onSetInactive?.();
                onComplete();
            }, 0);
        } else {
            setIsCorrect(false);
            setIsIncorrect(true);
            setShowFeedback(true);
            // Show feedback for incorrect answers, then return to choices
            setTimeout(() => {
                setShowFeedback(false);
                setIsIncorrect(false);
                setSelectedChoice(null);
            }, 1000);
        }
    };

    const handleMainClick = () => {
        if (!isActive && !isCompleted) {
            // Trigger lookat behavior
            onActivate?.();
            // Set this hotspot as active
            onSetActive?.();
        }
    };

    const getCurrentTexture = () => {
        if (isCompleted) return completedTexture;
        return initialTexture;
    };

    return (
        <group ref={groupRef} position={position}>
            {/* Main hotspot */}
            <mesh
                onPointerOver={() => setIsHovered(true)}
                onPointerOut={() => setIsHovered(false)}
                onClick={handleMainClick}
                scale={isHovered ? 1.1 : 1}
            >
                <circleGeometry args={[0.1, 64]} />
                <meshBasicMaterial 
                    map={getCurrentTexture()}
                    transparent
                    opacity={isHovered ? 0.8 : 1}
                />
            </mesh>
            
            {/* Choice buttons - only show when active and not showing feedback */}
            {isActive && !isCompleted && !showFeedback && (
                <group position={[0, 0.7, 0]}>
                    {choices.map((choice, index) => {
                        // Calculate grid position (2 columns)
                        const row = Math.floor(index / 2);
                        const col = index % 2;
                        
                        // Calculate spacing based on aspect ratio 738x169
                        const aspectRatio = 738 / 169; // ≈ 4.37
                        const choiceWidth = 1.5; // Increased from 1 to 1.5
                        const choiceHeight = choiceWidth / aspectRatio;
                        const spacingX = choiceWidth * 1.2;
                        const spacingY = choiceHeight * 1.2;
                        
                        const isChoiceHovered = hoveredChoiceIndex === index;
                        
                        return (
                            <mesh
                                key={choice.id}
                                position={[
                                    (col - 0.5) * spacingX, 
                                    -row * spacingY, 
                                    0
                                ]}
                                scale={isChoiceHovered ? 1.1 : 1}
                                onClick={() => handleChoiceSelect(choice)}
                                onPointerOver={() => setHoveredChoiceIndex(index)}
                                onPointerOut={() => setHoveredChoiceIndex(null)}
                            >
                                <planeGeometry args={[choiceWidth, choiceHeight]} />
                                <meshBasicMaterial 
                                    map={choicesTextures[index]}
                                    transparent
                                    opacity={1}
                                />
                            </mesh>
                        );
                    })}
                </group>
            )}
            
            {/* Feedback message - show when incorrect answer is selected */}
            {showFeedback && (
                <group position={[0, 0.7, 1]}>
                    <mesh>
                        <planeGeometry args={[2, 0.75]} />
                        <meshBasicMaterial 
                            map={feedbackTexture}
                            transparent
                            opacity={1}
                        />
                    </mesh>
                    {/* You can add text here if needed */}
                </group>
            )}
        </group>
    );
};

export default QCUhotspot;



