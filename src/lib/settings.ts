export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/admin(.*)":      ["admin", "superadmin"],
  "/ump(.*)":        ["ump", "admin", "superadmin"],
  "/upa(.*)":        ["upa", "admin", "superadmin"],
  "/uph(.*)":        ["uph", "admin", "superadmin"],
  "/saf(.*)":        ["saf", "admin", "superadmin"],
  "/ucp(.*)":        ["ucp", "admin", "superadmin"],
  "/diaconia(.*)":   ["diaconia", "admin", "superadmin"],
  "/conselho(.*)":   ["conselho", "admin", "superadmin"],
  "/ministerio(.*)": ["ministerio", "admin", "superadmin"],
  "/ebd(.*)":        ["ebd", "admin", "superadmin"],
  "/list/members":   ["admin", "superadmin"],
  "/list/position":  ["admin", "superadmin"],
};