//import './App.css'
import ArchimateJS from './components/ArchimateJS'
import { GlobalProvider } from './components/GlobalProvider'
import OpenAPIPanel from './components/OpenAPIPanel'

function App() {

  return (
    <GlobalProvider>
      <ArchimateJS />
      <OpenAPIPanel />
    </GlobalProvider>
  )
}

export default App
