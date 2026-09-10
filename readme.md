npm install
npm run scrape                    # uses urls.txt (default: winch strap)
npm run scrape -- --collection cargo-securement
node src/cli.js --urls urls.txt   # explicit URL file
node src/cli.js https://fleet-hero.com/products/other-product
node src/cli.js --collection cargo-securement