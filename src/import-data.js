import { getKeywords } from "./utils/google-sheet.js";
import { DomainRepository } from "./database/repository.js";

(async () => {
  const keywords = await getKeywords();
  const repository = new DomainRepository();
  await repository.importDomains(keywords);
  await repository.closeConnection();
})();
