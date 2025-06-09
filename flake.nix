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

            if [ ! -d ".venv" ]; then
              ${pkgs.uv}/bin/uv venv -p ${pythonVersion}/bin/python .venv
            fi
            source .venv/bin/activate

            ${pkgs.uv}/bin/uv pip install git+https://github.com/Jamiller137/zen-mapper.git@add_simplex_tree
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

