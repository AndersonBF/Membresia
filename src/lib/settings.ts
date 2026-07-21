// src/lib/settings.ts
export const ITEM_PER_PAGE = 10

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = {
  "/member": ["member", "admin", "superadmin", "pastor", "ump", "upa", "uph", "saf", "ucp", "diaconia", "conselho", "ministerio", "ebd"],
  "/admin(.*)":      ["admin", "superadmin"],
  "/pastor(.*)":     ["pastor", "superadmin"],
  "/ump(.*)":        ["ump", "admin", "superadmin", "pastor"],
  "/upa(.*)":        ["upa", "admin", "superadmin", "pastor"],
  "/uph(.*)":        ["uph", "admin", "superadmin", "pastor"],
  "/saf(.*)":        ["saf", "admin", "superadmin", "pastor"],
  "/ucp(.*)":        ["ucp", "admin", "superadmin", "pastor"],
  "/diaconia(.*)":   ["diaconia", "admin", "superadmin", "pastor"],
  "/conselho(.*)":   ["conselho", "admin", "superadmin", "pastor"],
  "/ministerio(.*)": ["ministerio", "admin", "superadmin", "pastor"],
  "/ebd(.*)":        ["ebd", "admin", "superadmin", "pastor"],
  "/list/members":       ["admin", "superadmin", "pastor"],
  "/list/members/(.*)":  ["admin", "superadmin", "pastor"],
  "/list/position":  ["admin", "superadmin", "pastor"],
  "/list/visitantes":    ["admin", "superadmin", "pastor"],
};