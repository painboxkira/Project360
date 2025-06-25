// Global hotspot manager to ensure only one info hotspot is active at a time
class HotspotManager {
    private activeHotspotRef = { current: null as any };
    private callbacks = new Map<any, () => void>();

    setActiveHotspot(hotspotRef: any, deactivateCallback: () => void) {
        // Deactivate the previously active hotspot
        if (this.activeHotspotRef.current && this.activeHotspotRef.current !== hotspotRef) {
            const callback = this.callbacks.get(this.activeHotspotRef.current);
            if (callback) {
                callback();
            }
        }

        // Set the new active hotspot
        this.activeHotspotRef.current = hotspotRef;
        this.callbacks.set(hotspotRef, deactivateCallback);
    }

    deactivateHotspot(hotspotRef: any) {
        if (this.activeHotspotRef.current === hotspotRef) {
            this.activeHotspotRef.current = null;
        }
        this.callbacks.delete(hotspotRef);
    }

    isActive(hotspotRef: any): boolean {
        return this.activeHotspotRef.current === hotspotRef;
    }
}

// Global instance
export const hotspotManager = new HotspotManager(); 