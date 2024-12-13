export class Domain {
  constructor(
    id,
    keyword, 
    site, 
    rank, 
    websiteVisitCount, 
    websiteNotVisitCount, 
    proxyBrowserErrorCount, 
    date,
    googleSheetId,
    browserType,
  ) {
    this.id = id;
    this.keyword = keyword;
    this.site = site;
    this.rank = rank;
    this.websiteVisitCount = websiteVisitCount;
    this.websiteNotVisitCount = websiteNotVisitCount;
    this.proxyBrowserErrorCount = proxyBrowserErrorCount;
    this.date = date;
    this.googleSheetId = googleSheetId;
    this.browserType = browserType;
  }
}
