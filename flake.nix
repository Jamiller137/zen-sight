{
  description = "Simplicial Complex Visualizations";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };

        pythonVersion = pkgs.python312;

        pythonPackages = ps: with ps; [
          numpy
          scikit-learn
          matplotlib
          networkx
          flask
          flask-cors
          numba
          setuptools
          wheel
          pip
        ];

        pythonEnv = pythonVersion.withPackages pythonPackages;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pythonEnv
            pkgs.nodejs
            pkgs.nodePackages.npm
            pkgs.uv
            pkgs.ruff
            pkgs.just
          ];

          NIX_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
            pkgs.stdenv.cc.cc
            pkgs.libz
          ];

          NIX_LD = pkgs.lib.fileContents "${pkgs.stdenv.cc}/nix-support/dynamic-linker";

          shellHook = ''
            echo "Entering zen-sight development environment"

            if [ ! -d ".venv" ]; then
              ${pkgs.uv}/bin/uv venv -p ${pythonVersion}/bin/python .venv
            fi
            source .venv/bin/activate

            ${pkgs.uv}/bin/uv pip install zen-mapper==0.3.0
            ${pkgs.uv}/bin/uv pip install -e .
          '';
        };

        packages.default = pkgs.python312Packages.buildPythonPackage {
          pname = "zen-sight";
          version = "0.1.3";
          src = ./.;

          nativeBuildInputs = [ pkgs.nodejs ];

          propagatedBuildInputs = pythonPackages pkgs.python312Packages;
        };

        apps.default = flake-utils.lib.mkApp {
          drv = self.packages.${system}.default;
          name = "zen-sight";
        };
      }
    );
}

