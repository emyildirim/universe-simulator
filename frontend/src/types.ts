export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface PlanetInfo {
  name: string;
  radius: number;
  type: string;
}

export interface PlanetData {
  position: Position;
  info: PlanetInfo;
}

export interface UniverseData {
  time: string;
  positions: {
    [planetName: string]: PlanetData;
  };
}