import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Heading } from '@chakra-ui/react';
//import { useReactFlow } from '@xyflow/react';

function NodeDetail({ node }) {
  const nodeType = node.type;
  const[value, setValue] = useState(node.data?.value || '');

  //const {updateNodeData} = useReactFlow();

  return (
    <Box>
      <Heading as="h3" size="md"> {nodeType.toUpperCase()} </Heading>
      {node.data?.value && (
        {value}
      )}
    </Box>
  );
}

NodeDetail.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    data: PropTypes.shape({
      value: PropTypes.data,
    }),
  }).isRequired,
};

export default NodeDetail;