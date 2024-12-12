import { DataSource } from "typeorm";
import { 
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE,
} from "../utils/common.js";
import { DomainShema } from "./entity/domain-schema.js";


export const dataSource = {
  type: "mysql",
  host: DB_HOST,
  port: 3306,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  synchronize: true,
  logging: false,
  entities: [DomainShema],
  autoLoadEntities: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  subscribers: [],
  migrations: [],
};
