import { InputNodeType } from "../types/nodeTypes";
import { ResourceFieldInputIcon, ResourceInputIcon, ResourceSchemaInputIcon } from "./icons";

export const INPUT_COMPONENTS = [
  {
    icon: ResourceInputIcon(),
    type: InputNodeType.Resource,
    label: "Resource",
  },
  {
    icon: ResourceSchemaInputIcon(),
    type: InputNodeType.Schema,
    label: "Schema",
  },
  {
    icon: ResourceFieldInputIcon(),
    type: InputNodeType.Field,
    label: "Field",
  },
]