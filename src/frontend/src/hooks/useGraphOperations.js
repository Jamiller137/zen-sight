import { useCutNodes } from "./useCutNodes";
import { useDuplicateNodes } from "./useDuplicateNodes";

export const useGraphOperations = (props) => {
  const { cutSelectedNodes } = useCutNodes(props);
  const { dupSelectedNodes } = useDuplicateNodes(props);

  return {
    cutSelectedNodes,
    dupSelectedNodes,
  };
};
