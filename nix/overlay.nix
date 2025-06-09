{ zen-mapper-flake }:

final: prev: {
  python3Packages = prev.python3Packages // {
    zen-sight = prev.python3Packages.callPackage ./zen-sight.nix {
      zen-mapper = zen-mapper-flake.packages.${final.system}.default;
    };
  };
}

