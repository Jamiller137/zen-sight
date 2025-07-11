from zen_sight.adapters import vis_zen_mapper
import zen_mapper as zm
from sklearn.cluster import DBSCAN
import numpy as np


def circle(n_points=1000, R=2.0, noise_level=0.00):
    theta = 2 * np.pi * np.random.uniform(0, 1, n_points)

    R_noisy = R + noise_level * np.random.randn(n_points)

    x = R_noisy * np.cos(theta)
    y = R_noisy * np.sin(theta)

    torus = np.column_stack((x, y))
    return torus


def main():
    data = circle()
    projection = data[:, 0]
    clusterer = zm.sk_learn(DBSCAN(eps=0.5))
    coverer = zm.Width_Balanced_Cover(n_elements=10, percent_overlap=0.3)

    result = zm.mapper(
        data=data,
        projection=projection,
        cover_scheme=coverer,
        clusterer=clusterer,
        dim=2,
    )

    vis_zen_mapper(result)


if __name__ == "__main__":
    main()
