import { Box } from "@chakra-ui/react";
import { Handle, Position } from "@xyflow/react";

function NodeComponent () {
	return <Box pos = {"relative"}>
		<svg width={200} height={200} xmlns="http://www.w3.org/2000/svg">
			<rect
			x="0"
			y="0"
			width={200}
			height={200}
			rx={20}
			ry={20}
			fill={"#FFFF007F"}
			/>
		</svg>
		<Handle type="source" position={Position.Right} id = "right" />
		<Handle type="source" position={Position.Left} id = "left" />
	</Box>;
};

export default NodeComponent;