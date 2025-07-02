import { useState, useCallback } from "react";
import { operationsAPI } from "../services/api";

export const useOperations = () => {
  const [cutOperations, setCutOperations] = useState([]);
  const [splitOperations, setSplitOperations] = useState([]);
  const [affectedNodes, setAffectedNodes] = useState(new Set());
  const [operationsHistory, setOperationsHistory] = useState([]);
  const [currentOperationIndex, setCurrentOperationIndex] = useState(-1);
  const [isReplayingOperation, setIsReplayingOperation] = useState(false);

  const saveOperation = useCallback(
    async (type, description, data = {}) => {
      if (isReplayingOperation) return;

      try {
        const operationData = {
          type,
          description,
          data,
          timestamp: new Date().toISOString(),
        };

        const response = await operationsAPI.saveOperation(operationData);
        if (response.data.success) {
          await fetchOperationsHistory();
        }
      } catch (error) {
        console.error("Error saving operation:", error);
      }
    },
    [isReplayingOperation],
  );

  const fetchOperationsHistory = useCallback(async () => {
    try {
      const response = await operationsAPI.getOperationsHistory();
      const history = response.data.history || [];
      setOperationsHistory(history);

      if (!isReplayingOperation) {
        setCurrentOperationIndex(history.length - 1);
      }
    } catch (error) {
      console.error("Error fetching operations history:", error);
    }
  }, [isReplayingOperation]);

  const replayToOperation = useCallback(async (operationIndex) => {
    try {
      setIsReplayingOperation(true);

      const response = await operationsAPI.replayToOperation(operationIndex);
      const replayedGraph = response.data.graph;

      setCurrentOperationIndex(operationIndex);

      setTimeout(() => {
        setIsReplayingOperation(false);
      }, 60);

      return replayedGraph;
    } catch (error) {
      console.error("Error replaying to operation:", error);
      setIsReplayingOperation(false);
      throw error;
    }
  }, []);

  return {
    cutOperations,
    setCutOperations,
    splitOperations,
    setSplitOperations,
    affectedNodes,
    setAffectedNodes,
    operationsHistory,
    currentOperationIndex,
    isReplayingOperation,
    saveOperation,
    fetchOperationsHistory,
    replayToOperation,
  };
};
