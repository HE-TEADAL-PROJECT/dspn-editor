import { useContext } from 'react';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { GlobalContext } from './GlobalContext';
import UploadButton from './UploadButton';

const Home = () => {
  const { openAPI } = useContext(GlobalContext);

  const getButtonStyle = (backgroundColor) => ({
    cursor: 'pointer',
    padding: '10px',
    backgroundColor: backgroundColor,
    color: 'white',
    borderRadius: '5px',
    border: 'none',
    marginRight: '10px'
  });

  return (
    <>
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>OpenAPI Visualizer</h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <UploadButton />
          {openAPI && (
            <span style={{ marginLeft: '10px' }}>{openAPI.info.title}</span>
          )}
          {openAPI && (
            <span style={{ marginLeft: '10px' }}>{openAPI.info.version}</span>
          )}
        </div>
        {openAPI && (
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => {}} style={getButtonStyle('#28a745')}>
              Go to Diagram
            </button>
          </div>
        )}
      </div>
      {openAPI && <SwaggerUI spec={openAPI} />}
    </>
  );
};

export default Home;