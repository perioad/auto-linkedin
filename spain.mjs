import { run } from './linkedin.mjs';

const url =
  'https://www.linkedin.com/jobs/search/?currentJobId=3935911247&distance=25&f_PP=103374081%2C105088894%2C105512687&f_T=9%2C3172%2C25170%2C39%2C17265%2C24%2C100&geoId=105646813&keywords=frontend&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true&sortBy=DD';

run(url, 'checked_vacancies_spain.json');
