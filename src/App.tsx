import SceneViewer from "./core/SceneViewer";
import Layout from "./hotspots/ActiveAi/Rapport/Layout";

function App() {
  return (
    <div className="App" style={{width: '100vw', height: '100vh'}}>
      <SceneViewer jsonPath="/complete-scene.json" />
    </div>
  );
}

export default App;