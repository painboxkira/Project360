import SceneViewer from "./core/SceneViewer";
function App() {
  return (
    <div className="App" style={{width: '100vw', height: '100vh'}}>
     <SceneViewer jsonPath="./complete-scene.json" />
    </div>
  );
}

export default App;