import { run } from './linkedin.mjs';

const url =
  'https://www.linkedin.com/jobs/search/?currentJobId=3937047848&distance=25&f_PP=106967730%2C100495942%2C100477049%2C106772406&f_T=9%2C3172%2C39%2C17265%2C25170%2C100&geoId=101282230&keywords=frontend&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true&sortBy=DD';

run(url, 'checked_vacancies_germany.json');
