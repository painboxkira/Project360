import * as THREE from "three";
import { useMemo, useRef, useState } from "react";
import { useTextureArrayWithFallbacks, useTextures } from "../core/hooks/useTexture";
import Checkbox3D from "../assets/checkbox";

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

const QCMhotspot = ({texturePath, position, onComplete, choices, onActivate, isActive = false, onSetActive, onSetInactive, questionTexture, submitTexture }: {
    texturePath: string[], 
    position: [number, number, number], 
    onComplete: () => void, 
    choices: Choice[],
    onActivate?: () => void,
    isActive?: boolean,
    onSetActive?: () => void,
    onSetInactive?: () => void,
    questionTexture?: string,
    submitTexture?: string
}) => {

    const checkedTexturePath = checkTexturePath(texturePath);

    const [isHovered, setIsHovered] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isIncorrect, setIsIncorrect] = useState(false);
    const [selectedChoices, setSelectedChoices] = useState<Set<string>>(new Set());
    const [showFeedback, setShowFeedback] = useState(false);
    const [hoveredChoiceIndex, setHoveredChoiceIndex] = useState<number | null>(null);
    const [canSubmit, setCanSubmit] = useState(false);
    
    const groupRef = useRef<THREE.Group>(null);

    // Load textures from global cache with fallbacks
    const textures = useTextureArrayWithFallbacks(checkedTexturePath, [
        "/textures/questiondef.png",
        "/textures/complete.png",
        "/textures/feedback.png"
    ]);

    const [initialTexture, completedTexture, feedbackTexture] = textures;
    
    const choicesTextures = useTextures(choices.map(choice => choice.texture));
    
    // Load question texture - handle undefined case
    const questionTextureMap = questionTexture ? useTextures([questionTexture])[0] : null;
    
    // Load submit button texture - handle undefined case
    const submitTextureMap = submitTexture ? useTextures([submitTexture])[0] : null;

    const handleChoiceToggle = (choice: Choice) => {
        setSelectedChoices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(choice.id)) {
                newSet.delete(choice.id);
            } else {
                newSet.add(choice.id);
            }
            return newSet;
        });
    };

    const handleSubmit = () => {
        // Get all correct choice IDs
        const correctChoiceIds = new Set(choices.filter(choice => choice.isCorrect).map(choice => choice.id));
        
        // Check if all selected choices are correct AND all correct choices are selected
        const allSelectedAreCorrect = Array.from(selectedChoices).every(id => correctChoiceIds.has(id));
        const allCorrectAreSelected = Array.from(correctChoiceIds).every(id => selectedChoices.has(id));
        
        if (allSelectedAreCorrect && allCorrectAreSelected) {
            // Perfect answer - all correct choices selected and no incorrect ones
            setIsCorrect(true);
            setIsIncorrect(false);
            setTimeout(() => {
                setIsCompleted(true);
                onSetInactive?.();
                onComplete();
            }, 500);
        } else {
            // Incorrect answer
            setIsCorrect(false);
            setIsIncorrect(true);
            setShowFeedback(true);
            // Show feedback for incorrect answers, then return to choices
            setTimeout(() => {
                setShowFeedback(false);
                setIsIncorrect(false);
                setSelectedChoices(new Set());
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

    // Check if submit button should be enabled (at least one choice selected)
    const submitEnabled = selectedChoices.size > 0;

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
                    opacity={isActive ? 0: 1}
                />
            </mesh>
            
            {/* Choice buttons - only show when active and not showing feedback */}
            {isActive && !isCompleted && !showFeedback && (() => {
                // Calculate spacing based on aspect ratio 738x169
                const aspectRatio = 738 / 169; // ≈ 4.37
                const choiceWidth = 1.5; // Increased from 1 to 1.5
                const choiceHeight = choiceWidth / aspectRatio;
                const spacingX = choiceWidth * 1.2;
                const spacingY = choiceHeight * 1.2;
                
                return (
                    <group position={[0, 0.2, 1]}>
                        {/* Question box positioned above choices */}
                        {questionTextureMap && (
                            <mesh position={[0, choiceHeight + 0.3, 0]}>
                                <planeGeometry args={[2, 0.5]} />
                                <meshBasicMaterial 
                                    map={questionTextureMap}
                                    transparent
                                    opacity={1}
                                    side={THREE.DoubleSide}
                                />
                            </mesh>
                        )}
                        
                        {choices.map((choice, index) => {
                            // Calculate grid position (2 columns)
                            const row = Math.floor(index / 2);
                            const col = index % 2;
                            
                            const isChoiceHovered = hoveredChoiceIndex === index;
                            const isSelected = selectedChoices.has(choice.id);
                            
                            return (
                                <group
                                    key={choice.id}
                                    position={[
                                        (col - 0.5) * spacingX, 
                                        -row * spacingY, 
                                        0
                                    ]}
                                    scale={isChoiceHovered ? 1.1 : 1}
                                >
                                    {/* Checkbox positioned to the left of the choice */}
                                    <Checkbox3D
                                        checked={isSelected}
                                        onToggle={() => handleChoiceToggle(choice)}
                                        position={[-choiceWidth  +0.9, 0, 0.05]}
                                        scale={0.15}
                                        checkedColor="#00ff00"
                                        checkedBorderColor="#00cc00"
                                        uncheckedColor="#ffffff"
                                        uncheckedBorderColor="#cccccc"
                                        hoverColor="#f0f0f0"
                                        checkmarkColor="#ffffff"
                                    />
                                    
                                    {/* Choice image */}
                                    <mesh
                                        onClick={() => handleChoiceToggle(choice)}
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
                                </group>
                            );
                        })}
                        
                        {/* Submit button */}
                        <mesh
                            position={[0, -choiceHeight -0.5, 0]}
                            scale={submitEnabled ? 1 : 0.8}
                            onClick={submitEnabled ? handleSubmit : undefined}
                            onPointerOver={() => submitEnabled && setHoveredChoiceIndex(-1)}
                            onPointerOut={() => setHoveredChoiceIndex(null)}
                        >
                            <planeGeometry args={[1., 0.3]} />
                            <meshBasicMaterial 
                                map={submitTextureMap}
                                transparent
                                opacity={1}
                            />
                        </mesh>
                    </group>
                );
            })()}
            
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
                </group>
            )}
        </group>
    );
};

export default QCMhotspot;






