import { DefaultNodeType, InputNodeType, OutputNodeType, PolicyNodeType } from "../types/nodeTypes";
import { DefaultPlatformIcon, DefaultRequestIcon, DefaultUserIcon, EncryptionPolicyIcon, FilterPolicyIcon, ProjectionPolicyIcon, RenamePolicyIcon, ResourceFieldInputIcon, ResourceInputIcon, ResourceOutputIcon, ResourceParameterInputIcon, ResourceResponseInputIcon, ResourceResponseOutputIcon } from "./icons";

export const INPUT_COMPONENTS = [
  {
    icon: ResourceInputIcon(),
    type: InputNodeType.Resource,
    label: "Resource",
    available: true,
  },
  {
    icon: ResourceResponseInputIcon(),
    type: InputNodeType.Response,
    label: "Response",
    available: true,
  },
  {
    icon: ResourceParameterInputIcon(),
    type: InputNodeType.Parameter,
    label: "Parameter",
  },
  {
    icon: ResourceFieldInputIcon(),
    type: InputNodeType.Field,
    label: "Field",
    available: true,
  },
]

export const POLICY_COMPONENTS = [
  {
    icon: RenamePolicyIcon(),
    type: PolicyNodeType.Rename,
    label: "Rename",
    available: true,
  },
  {
    icon: EncryptionPolicyIcon(),
    type: PolicyNodeType.Encryption,
    label: "Encryption",
    available: true,
  },
  {
    icon: ProjectionPolicyIcon(),
    type: PolicyNodeType.Projection,
    label: "Projection",
    available: true,
  },
  {
    icon: FilterPolicyIcon(),
    type: PolicyNodeType.Filter,
    label: "Filter",
    available: true,
  },
]

export const OUTPUT_COMPONENTS = [
  {
    icon: ResourceOutputIcon(),
    type: OutputNodeType.Resource,
    label: "Resource",
    available: true,
  },
  {
    icon: ResourceResponseOutputIcon(),
    type: OutputNodeType.Response,
    label: "Response",
    available: true,
  },
]

export const DEFAULT_COMPONENTS = [
  {
    icon: DefaultRequestIcon(),
    type: DefaultNodeType.Request,
    label: "HTTP Request",
    available: true,
  },
  {
    icon: DefaultPlatformIcon(),
    type: DefaultNodeType.Platform,
    label: "Platform",
    available: true,
  },
  {
    icon: DefaultUserIcon(),
    type: DefaultNodeType.User,
    label: "User",
    available: true,
  }
]