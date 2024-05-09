declare module "Danbooru" {
  export function error(msg: string, keepAlive: bool = false): void;
  export function notice(msg: string, keepAlive: bool = false): void;
}
