import './App.css'
import Header from "../src/components/Header.tsx"
import Canvas from "../src/components/Canvas.tsx"
import Sidebar from "../src/components/Sidebar.tsx"

function App() {
  return (
    <>
      <Header/>
        <div id="main-content">
          <Canvas/>
          <Sidebar/>
      </div>
    </>
  )
}

export default App
