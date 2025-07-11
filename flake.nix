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

      devShells.${system}.default =
        let
          allDevPackages = with pkgs; [
            python313
            nodejs
            nodePackages.npm
            pyright
            uv
            hatch
            jq
            just
            ruff
            zen-mapper.packages.${system}.default
            self.formatter.${system}
            zsh
            ncurses
            gnumake
          ];
        in
        pkgs.mkShell {
          shell = "${pkgs.zsh}/bin/zsh";

          NIX_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
            pkgs.stdenv.cc.cc
            pkgs.libz
          ];

          LC_ALL = "en_US.UTF-8";

          buildInputs = allDevPackages;

          shellHook = ''
            echo "DEBUG: Entering zen-sight devShell..."

            if [ -z "''${NIX_LD+x}" ]; then
              export LD_LIBRARY_PATH="$NIX_LD_LIBRARY_PATH"
              echo "DEBUG: LD_LIBRARY_PATH set to $LD_LIBRARY_PATH"
            fi

            export SHELL="$(command -v zsh)"
            echo "DEBUG: SHELL set to $SHELL"

            export UV_PYTHON="$(command -v python3.13)"
            echo "UV_PYTHON set to $UV_PYTHON"

            uv sync --group dev
            source .venv/bin/activate
            echo "DEBUG: Python venv activated."

            export HISTFILE="$HOME/.zsh_history"
            if [ -f "$HISTFILE" ]; then
              history -r
              echo "DEBUG: History loaded from $HISTFILE"
            else
              echo "DEBUG: No existing history file at $HISTFILE, starting fresh."
            fi

            echo "DEBUG: shellHook complete."
          '';
        };

      apps.${system}.default = {
        type = "app";
        program = "${self.packages.${system}.default}/bin/zen-sight";
      };
    };
}
