import { useContext } from 'react';
import { GlobalContext } from './GlobalContext.tsx';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

function OpenAPIPanel(){
  const { openAPI } = useContext(GlobalContext);
  const { showAPI } = useContext(GlobalContext);
  
  // Display the panel only if OpenAPI is loaded
  if(!showAPI) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: document.querySelector('.navbar')?.clientHeight ,
        right: 1,
        width: "30%",
        height: "50%",
        backgroundColor: "white",
        overflowY: "auto",
        zIndex: 1000,
        border: "1px solid black",
      }}
    >
      <SwaggerUI spec={openAPI} />
    </div>
  );
};

export default OpenAPIPanel;