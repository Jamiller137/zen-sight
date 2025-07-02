import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5050/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const graphAPI = {
  getGraphData: () => api.get("/graph-data"),
};

export const operationsAPI = {
  saveOperation: (operationData) => api.post("/save-operation", operationData),
  getOperationsHistory: () => api.get("/operations-history"),
  replayToOperation: (operationIndex) =>
    api.get(`/replay-to-operation/${operationIndex}`),
};
