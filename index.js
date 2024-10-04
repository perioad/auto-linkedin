const puppeteer = require('puppeteer');

async function checkAppointment() {
  console.log('start');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    executablePath:
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--user-data-dir=C:\\Users\\perioad\\AppData\\Local\\Google\\Chrome\\User Data',
    ],
    // args: ['--no-sandbox', '--disabled-setupid-sandbox'],
  });
  // executablePath:
  //   'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  );
  // Navigate the page to a URL
  await page.goto('https://otv.verwalt-berlin.de/ams/TerminBuchen');

  const terminBuchen = await page.waitForSelector('a::-p-text(Termin buchen)');
  console.log('terminBuchen: ', terminBuchen);

  await Promise.all([terminBuchen?.click(), page.waitForNavigation()]);

  console.log('navigated 1');

  //   await page.waitForNavigation();

  //   const checkbox = await page.waitForSelector('#xi-cb-1');
  //   console.log('checkbox: ', checkbox);

  //   await checkbox?.click();

  //   const weiter = await page.waitForSelector('button ::-p-text(Weiter)');
  //   console.log('weiter: ', weiter);

  //   weiter?.click();

  //   const angaben = await page.waitForSelector(
  //     'fieldset ::-p-text(Angaben zum Anliegen)'
  //   );
  //   console.log('angaben: ', angaben);

  //   await browser.close();

  console.log('finish');
}

// Run the check periodically
// Adjust the interval as needed. This example uses 60000 milliseconds (1 minute)
// setInterval(checkAppointment, 60000);
checkAppointment();
