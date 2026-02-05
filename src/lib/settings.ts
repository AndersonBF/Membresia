export const ITEM_PER_PAGE = 5

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)": ["admin"],
  "/teacher(.*)": ["teacher"],
  "/student(.*)": ["student"],
  "/parent(.*)": ["parent"],
  "/list/members": ["admin", "teacher"],
  "/list/position": ["admin", "teacher"],
};