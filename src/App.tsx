import React from "react";
import SceneViewer from "./core/SceneViewer";


const App: React.FC = () => {
  return (
    <div className="App" style={{width: '100vw', height: '100vh'}}>
      <SceneViewer jsonPath="/complete-scene.json" />
    </div>
  );
}

export default App;