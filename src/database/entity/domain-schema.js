import { EntitySchema } from "typeorm";
import { Domain } from "../model/domain.js";

export const DomainShema = new EntitySchema({
  name: "domains",
  target: Domain,
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    keyword: {
        type: "varchar",
    },
    site: {
        type: "varchar",
    },
    rank: {
        type: "int",
        default: 0,
    },
    websiteVisitCount: {
      type: "int",
      default: 0,
    },
    websiteNotVisitCount: {
      type: "int",
      default: 0,
    },
    proxyBrowserErrorCount: {
      type: "int",
      default: 0,
    },
    googleSheetId: {
      type: "varchar",
    },
    date: {
      type: 'datetime',
    }
  },
});
