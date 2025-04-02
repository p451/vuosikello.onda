import React from 'react';
import AikajanaKalenteri from './components/AikajanaKalenteri';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="bg-blue-500 text-white p-4 mb-4">
        <h1 className="text-2xl font-bold">Vuosikalenteri</h1>
      </header>
      <main>
        <AikajanaKalenteri />
      </main>
    </div>
  );
}

export default App;