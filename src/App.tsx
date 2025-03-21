import { ReactFlowProvider } from '@xyflow/react'
import { GlobalProvider } from './components/GlobalProvider'
import Workflow from './components/Workflow'
import { ChakraProvider, defaultSystem  } from '@chakra-ui/react'

function App() {

  return (
    <GlobalProvider>
      <ChakraProvider value={defaultSystem}>
        <ReactFlowProvider>
          <div className="App">
            <Workflow />
          </div>
        </ReactFlowProvider>
      </ChakraProvider>
    </GlobalProvider>
  )
}

export default App
