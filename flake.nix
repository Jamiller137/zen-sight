{
  description = "Simplicial Complex Visualizations";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    zen-mapper.url = "github:Jamiller137/zen-mapper/add_simplex_tree"; 
    zen-mapper.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, flake-utils, zen-mapper, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ zen-mapper.overlays.default ];
        };

        pythonVersion = pkgs.python312;

        pythonPackages = ps: with ps; [
          zen-mapper
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
            zen-mapper.packages.${system}.default
          ];

          NIX_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
            pkgs.stdenv.cc.cc
            pkgs.libz
          ];

          NIX_LD = pkgs.lib.fileContents "${pkgs.stdenv.cc}/nix-support/dynamic-linker";

          shellHook = ''
            echo "Entering zen-sight development environment"

            # Create virtual environment
            if [ ! -d ".venv" ]; then
              ${pythonVersion}/bin/python -m uv venv .venv
            fi
            source .venv/bin/activate

            uv pip install --upgrade pip

            echo "Installing zen-mapper..."
            ZEN_MAPPER_PATH=${zen-mapper}
            uv pip install -e $ZEN_MAPPER_PATH

            uv pip install -e .
          '';
        };

        packages.default = pkgs.python312Packages.buildPythonPackage {
          pname = "zen-sight";
          version = "0.1.0";
          src = ./.;

          nativeBuildInputs = [ pkgs.nodejs ];

          propagatedBuildInputs = pythonPackages pkgs.python312Packages;
        };

        # App definition
        apps.default = flake-utils.lib.mkApp {
          drv = self.packages.${system}.default;
          name = "zen-sight";
        };
      }
    );
}

