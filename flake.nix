{
  description = "Simplicial Complex Visualizations";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    zen-mapper = {
      url = "github:zen-mapper/zen-mapper";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    { self
    , nixpkgs
    , zen-mapper
    ,
    }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      formatter.${system} = pkgs.alejandra;

      packages.${system}.default = pkgs.python3Packages.callPackage ./nix/zen-sight.nix {
        zen-mapper = zen-mapper.packages.${system}.default;
      };

      overlays.default = import ./nix/overlay.nix {
        zen-mapper-flake = zen-mapper;
      };

      templates.default = {
        path = ./nix/templates/minimal;
        description = "A minimal flake loading zen-sight";
      };

      checks.${system} = builtins.listToAttrs (
        map
          (python: {
            name = python;
            value = pkgs."${python}".pkgs.callPackage ./nix/zen-sight.nix {
              zen-mapper = zen-mapper.packages.${system}.default;
            };
          })
          [
            "python313"
            "python312"
            "python311"
          ]
      );

      devShells.${system}.default = pkgs.mkShell {
        NIX_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
          pkgs.stdenv.cc.cc
          pkgs.libz
        ];

        LC_ALL = "en_US.UTF-8";

        buildInputs = [
          pkgs.nodejs
          pkgs.nodePackages.npm
          pkgs.pyright
          pkgs.uv
          pkgs.hatch
          pkgs.jq
          pkgs.just
          pkgs.ruff
          zen-mapper.packages.${system}.default
          self.formatter.${system}
        ];

        shellHook = ''
          if [ -z ''${NIX_LD+x} ]
          then
            export LD_LIBRARY_PATH="$NIX_LD_LIBRARY_PATH"
          fi
          echo "Entering zen-sight development environment"
          uv sync --group dev
          source .venv/bin/activate
        '';
      };

      apps.${system}.default = {
        type = "app";
        program = "${self.packages.${system}.default}/bin/zen-sight";
      };
    };
}
