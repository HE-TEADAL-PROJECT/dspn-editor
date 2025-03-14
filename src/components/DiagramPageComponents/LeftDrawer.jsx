import { useState, useContext } from 'react';
import './LeftDrawer.css';
import { GlobalContext } from '../GlobalContext';
import UploadButton from '../UploadButton';

const LeftDrawer = () => {
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const { openAPI } = useContext(GlobalContext);

  const toggleResources = () => {
    setIsResourcesOpen(!isResourcesOpen);
  };

  const togglePolicies = () => {
    setIsPoliciesOpen(!isPoliciesOpen);
  };

  // If no API file is uploaded, display a message and the upload button to allow the user to upload a file
  if(!openAPI) {
    return (
        <div className= 'no-file-uploaded'>
            No API file uploaded yet!
            <UploadButton />
        </div>
    );
  }
  //Else, display the left drawer with the API information
  //TODO: add resources and policies as components?
  else{
    return (
        <div className={`temp-class`}>
            <div className="drawer-content">
            <h2>{openAPI.info.title}</h2>
            <h3 onClick={toggleResources} className="resources-title">
                Resources {isResourcesOpen ? '▲' : '▼'}
            </h3>
            {isResourcesOpen && (
                <ul>
                {Object.keys(openAPI.paths).map((path, index) => (
                    <li key={index}>{path}</li>
                ))}
                </ul>
            )}
            <h3 onClick={togglePolicies} className="policies-title">
                Policies {isPoliciesOpen ? '▲' : '▼'}
            </h3>
            {isPoliciesOpen && (
                <ul>
                TODO
                </ul>
            )}
            </div>
        </div>
    );
}
};

export default LeftDrawer;