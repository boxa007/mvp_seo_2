### site-rating

Copy the appropriate file and rename it, removing the name ".example".
```bash
cp .example.api.env .api.env
```

Fill in the basic configuration values
```bash
API_TOKEN=
PROFILE_DEBUG=
# proxy settings
PROXY_TYPE=
PROXY_HOST=
PROXY_PORT=
PROXY_USERNAME=
PROXY_PASSWORD=
# google sheet
GOOGLE_SHEET_ID=
NUM_THREADS=
```
example:
```bash
API_TOKEN=0729d566e6014185a3b1dcae5a95b32a
PROFILE_DEBUG=true
PROXY_TYPE=http
PROXY_HOST=139.84.168.2
PROXY_PORT=18379
PROXY_USERNAME=monika120609
PROXY_PASSWORD=d3wbd5an1rsz
GOOGLE_SHEET_ID=1zqsKpw2XtEKapWSTL9zlQvifjIFKWwVXV2omt5hfnHs
NUM_THREADS=4
```

for change google gmail and private key, need change file in `./src/config/*.json`

install dependencies
```bash
npm install
```

run program:
```bash
npm run start-app
```
