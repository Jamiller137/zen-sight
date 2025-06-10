{ lib
, buildPythonPackage
, setuptools
, wheel
, nodejs
, numpy
, scikit-learn
, matplotlib
, networkx
, flask
, flask-cors
, numba
, # zen-mapper from flake
  zen-mapper
,
}:

buildPythonPackage rec {
  pname = "zen-sight";
  version = "0.1.5";
  pyproject = true;

  src = lib.cleanSource ./../.;

  nativeBuildInputs = [
    setuptools
    wheel
    nodejs
  ];

  propagatedBuildInputs = [
    numpy
    scikit-learn
    matplotlib
    networkx
    flask
    flask-cors
    numba
    zen-mapper
  ];

  doCheck = false;

  pythonImportsCheck = [
    "zen_sight"
  ];

  meta = with lib; {
    description = "Simplicial Complex Visualizations";
    homepage = "https://github.com/Jamiller137/zen-sight";
  };
}
