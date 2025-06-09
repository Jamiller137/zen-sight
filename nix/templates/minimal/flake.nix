{
  description = "Minimal zen-sight example";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    zen-sight.url = "github:Jamiller137/zen-sight";
  };

  outputs =
    { self
    , nixpkgs
    , zen-sight
    ,
    }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [
          zen-sight.packages.${system}.default
          pkgs.python3
        ];
      };

      packages.${system}.default = zen-sight.packages.${system}.default;
    };
}

