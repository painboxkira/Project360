import React from 'react';
import EventManager from './core/eventManager/eventManager';
import './App.css'

function App() {
  return (
    // --- STYLE CHANGE: Added 'flex flex-col' to create a vertical flex container ---
    <div style={{ height: '100vh' ,width:'98%'}} >
     

      {/* --- STYLE CHANGE: 'flex-1' makes the main section grow to fill available space --- */}
      {/* 'overflow-y-auto' ensures only this section scrolls if content is too long */}
      
        <EventManager jsonPath='./complete-scene.json' />
  
    </div>
  );
}

export default App;