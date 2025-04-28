import json
import numpy as np


class NumpyEncoder(json.JSONEncoder):
    """JSON encoder with numpy array support."""

    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        return super().default(obj)
