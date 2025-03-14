import { GlobalProvider } from './components/GlobalContext'
import { ReactFlowProvider } from '@xyflow/react';

import Home from './components/Home'
import DiagramPage from './components/DiagramPageComponents/DiagramPage'
import Workflow from './components/Workflow';
import { ChakraProvider } from '@chakra-ui/react';

function App() {

  return (
    <ChakraProvider>
      <ReactFlowProvider>
        <div className="App">
          <Workflow />
        </div>
      </ReactFlowProvider>
    </ChakraProvider>
  )
}

export default App
