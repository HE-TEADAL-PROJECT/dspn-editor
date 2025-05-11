// Red color: 23 f35246
// Green color: 23 C9E7B7

//Class names used to add stroke to the icons

import { faArrowRight, faArrowsToDot, faFilter, faLayerGroup, faPencil, faQuestion, faScissors, faShieldHalved, faUser, faUserSecret } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { defaultColor, inputColor, policyColor } from "./nodesDefinitions";
import { NodeType, InputNodeType, OutputNodeType, PolicyNodeType, DefaultNodeType } from "../types/nodeTypes";

export function ResourceInputIcon(){
  return (
    <img
      src = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3csvg%20width='18'%20height='18'%20viewBox='0%200%2018%2018'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m%207.5%209.5%20h%20-7%20m%2017%200%20a%205%205%2090%200%200%20-10%200%20a%205%205%2090%200%200%2010%200%20z'%20fill='%23C9E7B7'%20stroke='black'%20stroke-width='1'%20/%3e%3c/svg%3e"
      alt="Icon"
      width="18"
      height="18"
    />
  );
}

export function ResourceResponseInputIcon(){
  return(
    <img
      src="data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3csvg%20width='18'%20height='18'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20x='2'%20y='5'%20width='9'%20height='3'%20fill='%23C9E7B7'%20stroke='black'%20stroke-width='1'%20pointer-events='all'/%3e%3crect%20x='5'%20y='10'%20width='9'%20height='3'%20fill='%23C9E7B7'%20stroke='black'%20stroke-width='1'%20pointer-events='all'/%3e%3crect%20x='8'%20y='15'%20width='9'%20height='3'%20fill='%23C9E7B7'%20stroke='black'%20stroke-width='1'%20pointer-events='all'/%3e%3c/svg%3e"
      alt="Icon"
      width="18"
      height="18"
    />
  );
}

export function ResourceParameterInputIcon(){
  return(
    <FontAwesomeIcon icon={faQuestion} style={{color: inputColor}} className="my-icon"/>
  );
}

export function ResourceFieldInputIcon(){
  return(
    <img
      src="data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3csvg%20width='18'%20height='18'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20x='2'%20y='5'%20width='9'%20height='3'%20fill='%23C9E7B7'%20stroke='black'%20stroke-width='1'%20pointer-events='all'/%3e%3c/svg%3e"
      alt="Icon"
      width="18"
      height="18"
    />
  );
}


export function RenamePolicyIcon(){
  return(
    <FontAwesomeIcon icon={faPencil} style={{color: policyColor}} className="my-icon"/>
  );
}

export function EncryptionPolicyIcon(){
  return(
    <FontAwesomeIcon icon={faShieldHalved} style={{color: policyColor}} className="my-icon"/>
  );
}

export function ProjectionPolicyIcon(){
  return(
    <FontAwesomeIcon icon={faScissors} style={{color: policyColor}} className="my-icon"/>
  );
}

export function FilterPolicyIcon(){
  return(
    <FontAwesomeIcon icon={faFilter} style={{color: policyColor}} className="my-icon"/>
  );
}

export function AggregationPolicyIcon(){
  return(
    <FontAwesomeIcon icon={faArrowsToDot} style={{color: policyColor}} className="my-icon"/>
  );
}

export function AnonymizationPolicyIcon(){
  return(
    <FontAwesomeIcon icon={faUserSecret} style={{color: policyColor}} className="my-icon"/>
  );
}

export function ResourceOutputIcon(){
  return (
    <img
      src = "data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3csvg%20width='18'%20height='18'%20viewBox='0%200%2018%2018'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m%207.5%209.5%20h%20-7%20m%2017%200%20a%205%205%2090%200%200%20-10%200%20a%205%205%2090%200%200%2010%200%20z'%20fill='%23f35246'%20stroke='black'%20stroke-width='1'%20/%3e%3c/svg%3e"
      alt="Icon"
      width="18"
      height="18"
    />
  );
}

export function ResourceResponseOutputIcon(){
  return(
    <img
      src="data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'%20standalone='no'?%3e%3csvg%20width='18'%20height='18'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20x='2'%20y='5'%20width='9'%20height='3'%20fill='%23f35246'%20stroke='black'%20stroke-width='1'%20pointer-events='all'/%3e%3crect%20x='5'%20y='10'%20width='9'%20height='3'%20fill='%23f35246'%20stroke='black'%20stroke-width='1'%20pointer-events='all'/%3e%3crect%20x='8'%20y='15'%20width='9'%20height='3'%20fill='%23f35246'%20stroke='black'%20stroke-width='1'%20pointer-events='all'/%3e%3c/svg%3e"
      alt="Icon"
      width="18"
      height="18"
    />
  );
}

export function DefaultRequestIcon(){
  return(
    <FontAwesomeIcon icon={faArrowRight} style={{color: defaultColor}} className="my-icon"/>
  );
}

export function DefaultPlatformIcon(){
  return(
    <FontAwesomeIcon icon={faLayerGroup} style={{color: defaultColor}} className="my-icon"/>
  );
}

export function DefaultUserIcon(){
  return(
    <FontAwesomeIcon icon={faUser} style={{color: defaultColor}} className="my-icon"/>
  );
}

export function getIcon(type: NodeType, subType: InputNodeType | PolicyNodeType | OutputNodeType | DefaultNodeType) {
  let icon = null;

  switch (type) {
    case NodeType.Input:
      switch (subType) {
        case InputNodeType.Resource:
          icon = ResourceInputIcon();
          break;
        case InputNodeType.Response:
          icon = ResourceResponseInputIcon();
          break;
        case InputNodeType.Parameter:
          icon = ResourceParameterInputIcon();
          break;
        case InputNodeType.Field:
          icon = ResourceFieldInputIcon();
          break;
        default:
          console.error("Unknown Input node subtype:", subType);
          break;
      }
      break;
      
    case NodeType.Policy:
      switch (subType) {
        case PolicyNodeType.Rename:
          icon = RenamePolicyIcon();
          break;
        case PolicyNodeType.Encryption:
          icon = EncryptionPolicyIcon();
          break;
        case PolicyNodeType.Projection:
          icon = ProjectionPolicyIcon();
          break;
        case PolicyNodeType.Filter:
          icon = FilterPolicyIcon();
          break;
        case PolicyNodeType.Aggregation:
          icon = AggregationPolicyIcon();
          break;
        case PolicyNodeType.Anonymization:
          icon = AnonymizationPolicyIcon();
          break;
        default:
          console.error("Unknown Policy node subtype:", subType);
          break;
      }
      break;
      
    case NodeType.Output:
      switch (subType) {
        case OutputNodeType.Response:
          icon = ResourceResponseOutputIcon();
          break;
        case OutputNodeType.Resource:
          icon = ResourceOutputIcon();
          break;
        default:
          console.error("Unknown Output node subtype:", subType);
          break;
      }
      break;
      
    case NodeType.Default:
      switch (subType) {
        case DefaultNodeType.Request:
          icon = DefaultRequestIcon();
          break;
        case DefaultNodeType.Platform:
          icon = DefaultPlatformIcon();
          break;
        case DefaultNodeType.User:
          icon = DefaultUserIcon();
          break;
        default:
          console.error("Unknown Default node subtype:", subType);
          break;
      }
      break;
      
    default:
      console.error("Unknown node type:", type);
      break;
  }
  
  return icon;
}