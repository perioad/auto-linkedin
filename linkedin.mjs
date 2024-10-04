import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import axios from 'axios';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const openai = new OpenAI({
  apiKey: '',
});

const shouldRunInRealBrowser = process.argv[2] === 'real';
console.log('shouldRunInRealBrowser: ', shouldRunInRealBrowser);
const MINUTES_FREQUENCY = 5;

// Telegram bot token and chat ID
const TELEGRAM_BOT_TOKEN = '';
const TELEGRAM_CHAT_ID = '';

// LinkedIn credentials
const LINKEDIN_EMAIL = '';
const LINKEDIN_PASSWORD = '';

let isFirstRun = false;

export function run(url, fileName) {
  puppeteer
    .use(StealthPlugin())
    .launch({
      headless: !shouldRunInRealBrowser,
      slowMo: 100,
      defaultViewport: { width: 1920, height: 6000 },
    })
    .then(async (browser) => {
      console.log('Run started at: ', new Date().toLocaleString());

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const JSON_FILE_PATH = path.join(__dirname, fileName);
      const data = await fs.readFile(JSON_FILE_PATH, 'utf8');
      const checkedVacancies = new Set(JSON.parse(data));

      const page = await browser.newPage();

      await page.goto('https://www.linkedin.com/login');

      await page.type('#username', LINKEDIN_EMAIL);
      await page.type('#password', LINKEDIN_PASSWORD);

      const submit = await page.waitForSelector('button ::-p-text(Sign in)');

      await submit?.click();

      await page.waitForNavigation();

      console.log('navigated to linkedin');

      async function checkForNewJobs() {
        console.log('checking for new jobs', new Date().toLocaleString());
        console.log('is first run', isFirstRun);
        // Go to the filtered job search page
        await page.goto(url);

        console.log('navigated to job positions');

        // Get job listings
        const jobListings = await page.$$eval(
          'li.jobs-search-results__list-item',
          (jobs) => {
            return jobs.map((job) => ({
              id: job.getAttribute('data-occludable-job-id'),
              title: job
                .querySelector('.job-card-list__title span')
                ?.innerText.toLowerCase()
                .trim(),
              company: job
                .querySelector('.job-card-container__primary-description')
                ?.innerText.toLowerCase()
                .trim(),
              link: job.querySelector('.job-card-container__link')?.href,
            }));
          }
        );

        for (const job of jobListings) {
          const jobIdentifier = `${job.title} at ${job.company}`;

          console.log('jobIdentifier: ', jobIdentifier, '\n');

          if (!checkedVacancies.has(jobIdentifier)) {
            checkedVacancies.add(jobIdentifier);

            if (!isFirstRun) {
              console.log('clicking job posting');
              // Click on the job posting to get job details
              await page.click(`li[data-occludable-job-id="${job.id}"]`);
              await wait(5000);

              console.log('extracting description');
              // Extract job description
              const jobDescription = await page.$eval(
                '#job-details',
                (el) => el.innerText
              );

              console.log('job description succesfully extracted');

              // Send job description to OpenAI for analysis
              const { explanation, shouldApply } = await checkJobSuitability(
                jobDescription,
                jobIdentifier
              );

              if (shouldApply) {
                await sendTelegramMessage(
                  `New job found: ${job.title} at ${job.company}\nLink: ${job.link}`
                );
              }
            }
          }
        }

        await fs.writeFile(
          JSON_FILE_PATH,
          JSON.stringify([...checkedVacancies]),
          'utf8'
        );

        console.log('Run finished at: ', new Date().toLocaleString(), '\n');
      }

      // Initial job check
      await checkForNewJobs();

      // Schedule job check every 15 minutes
      setInterval(async () => {
        await checkForNewJobs();
      }, MINUTES_FREQUENCY * 60 * 1000);

      isFirstRun = false;
    })
    .catch(async (error) => {
      console.log('caught error', error, error?.message);

      await sendTelegramMessage(`failed: ${fileName}`);

      run(url, fileName);
    });
}

async function sendTelegramMessage(message) {
  console.log('sendTelegramMessage', message);

  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    }
  );
}

async function checkJobSuitability(jobDescription, jobTitle) {
  const experience = ``;
  const content = `
Evaluate if my experience aligns with the provided job posting.
My experience: '${experience}'.
Job title: '${jobTitle}'.
Job description: '${jobDescription}'.
Important considerations:
1. If the job requires language skills that I don't have, shouldApply is false.
2. If the job title contains backend or full stack, shouldApply is false.
Respond strictly in JSON format with the following keys:
- shouldApply: boolean - whether my experience matches the job requirements.
- explanation: string - your rationale for the decision.
Take a deep breath before answering.
Don't foget about important considerations mentioned above
`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content }],
    model: 'gpt-4o',
    response_format: {
      type: 'json_object',
    },
  });

  console.log(completion.choices[0].message.content, '\n');

  return JSON.parse(completion.choices[0].message.content);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// https://www.linkedin.com/jobs/search/?currentJobId=3935911247&distance=25&f_PP=103374081%2C105088894%2C105512687&f_T=9%2C3172%2C25170%2C39%2C17265%2C24%2C100&geoId=105646813&keywords=frontend&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true&sortBy=DD
