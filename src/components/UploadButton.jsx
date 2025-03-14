import { useState, useContext, useEffect } from 'react';
import useParse from "./UseParse";
import { GlobalContext } from './GlobalContext';

const UploadButton = () => {
  const [fileContent, setFileContent] = useState(null);
  const {parsedFile: openAPI, isLoaded: isOpenAPILoaded, error: openAPIError} = useParse(fileContent);
  const { setOpenAPI } = useContext(GlobalContext);


  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  //Update the global context with the parsed OpenAPI data
  useEffect(() => {
    if(openAPI && isOpenAPILoaded){
      setOpenAPI(openAPI);
    }
  }, [openAPI, isOpenAPILoaded, setOpenAPI]);

  const getButtonStyle = (backgroundColor) => ({
    cursor: 'pointer',
    padding: '10px',
    backgroundColor: backgroundColor,
    color: 'white',
    borderRadius: '5px',
    border: 'none',
    marginRight: '10px'
  });

  return(
    <>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <label htmlFor="fileInput" style={getButtonStyle('#007bff')}>
          Choose File
        </label>
        <input
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileUpload}
          id="fileInput"
          style={{ display: 'none' }}
        />
      </div>
    </>
  ); 

};

export default UploadButton;