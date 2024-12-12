import { DataSource } from 'typeorm';
import { dataSource } from './data-source.js';
import { Domain } from './model/domain.js';
import { GOOGLE_SHEET_ID } from '../utils/common.js';


export class DomainRepository {
  constructor() {
    this.dataSource = new DataSource(dataSource);
  }

  async initializeConnection() {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }

  async getDomains() {
    await this.initializeConnection();
    return await this.dataSource.getRepository(Domain).find({ where: { googleSheetId: GOOGLE_SHEET_ID } });
  }

  async closeConnection () {
    if (await this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  async getDomain(domain) {
    await this.initializeConnection();
    const repository = await this.dataSource.getRepository(Domain);
    return repository.findOne(
      {
        where: {
          site: domain.site,
          keyword: domain.keyword,
          googleSheetId: domain.googleSheetId,
        }
      }
    );
  }

  async getDomainById(domain) {
    await this.initializeConnection();
    const repository = await this.dataSource.getRepository(Domain);
    return repository.findOne({ where: { id: domain.id } });
  }

  async updateDomainById(id, rank, isWisitWebsite, proxyError) {
    await this.initializeConnection();
    const foundDomain = await this.getDomainById(new Domain(id));
    if (!foundDomain) {
      console.warn(`Not domain by id=(${id})`);
    }

    const repository = await this.dataSource.getRepository(Domain);

    // update rank
    foundDomain.rank = rank ?? foundDomain.rank;
    // increment count of `website visit site`
    if (isWisitWebsite && !proxyError) {
      foundDomain.websiteVisitCount += 1;
    }
    // increment count of `proxy error`
    if (!isWisitWebsite && proxyError) {
      foundDomain.proxyBrowserErrorCount += 1;
    }
    // increment count of `website not visit count`
    if (!isWisitWebsite && !proxyError) {
      foundDomain.websiteNotVisitCount += 1;
    }
    // update datetime
    foundDomain.date = new Date();

    await repository.update({ id: foundDomain.id }, foundDomain);
  }

  async importDomains(domains) {
    await this.initializeConnection();
    const repository = await this.dataSource.getRepository(Domain);
    await Promise.all(
        domains.map(async (domain) => {
          const domainModel = new Domain(
            null,
            domain.keyword, 
            domain.site, 
            domain.rank, 
            domain.websiteVisitCount,
            domain.websiteNotVisitCount,
            domain.proxyBrowserErrorCount,
            new Date(),
            GOOGLE_SHEET_ID,
        )
        const foundDomain = await this.getDomain(domainModel);
        if (!foundDomain) {
          await repository.save(domainModel);
        }
      })
    );
    console.log('Imported domains');
  }
}