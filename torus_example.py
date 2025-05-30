from zen_sight.adapters import vis_zen_mapper
from zen_mapper import mapper
from zen_mapper.cover import Width_Balanced_Cover
from sklearn.cluster import DBSCAN
from zen_mapper.cluster import sk_learn
import numpy as np


def create_torus(n_points=10000, R=2.0, r=1.0, noise_level=0.00):
    theta = 2 * np.pi * np.random.uniform(0, 1, n_points)
    phi = 2 * np.pi * np.random.uniform(0, 1, n_points)

    R_noisy = R + noise_level * np.random.randn(n_points)
    r_noisy = r + noise_level * np.random.randn(n_points)

    x = (R_noisy + r_noisy * np.cos(theta)) * np.cos(phi)
    y = (R_noisy + r_noisy * np.cos(theta)) * np.sin(phi)
    z = r_noisy * np.sin(theta)

    torus = np.column_stack((x, y, z))
    return torus


def main():
    data = create_torus()
    projection = data[:, :2]
    clusterer = sk_learn(DBSCAN(eps=0.5))
    coverer = Width_Balanced_Cover(n_elements=10, percent_overlap=0.3)

    result = mapper(
        data=data,
        projection=projection,
        cover_scheme=coverer,
        clusterer=clusterer,
        dim=2,
    )

    vis_zen_mapper(result)


if __name__ == "__main__":
    main()
