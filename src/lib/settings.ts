export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

const allRoles = ["member", "admin", "superadmin", "ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd"];

export const routeAccessMap: RouteAccessMap = {
  "/member":         allRoles,
  "/admin(.*)":      ["admin", "superadmin"],
  "/ump(.*)":        ["ump", "admin", "superadmin"],
  "/upa(.*)":        ["upa", "admin", "superadmin"],
  "/uph(.*)":        ["uph", "admin", "superadmin"],
  "/saf(.*)":        ["saf", "admin", "superadmin"],
  "/ucp(.*)":        ["ucp", "admin", "superadmin"],
  "/diaconia(.*)":   ["diaconia", "admin", "superadmin"],
  "/conselho(.*)":   ["conselho", "admin", "superadmin"],
  // /ministerio      → lista de ministérios (qualquer um logado)
  // /ministerio/[id] → página individual (qualquer membro pode acessar;
  //                    a page.tsx verifica se é membro daquele ministério)
  "/ministerio(.*)": allRoles,
  "/ebd(.*)":        ["ebd", "admin", "superadmin"],
  "/list/members":   ["admin", "superadmin"],
  "/list/position":  ["admin", "superadmin"],
};