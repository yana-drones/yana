import { workshopArticles } from './planning-workshop.mjs';
import { collegeArticles } from './planning-college.mjs';
import { teachingArticles } from './planning-teaching.mjs';
import { buyingArticles } from './planning-buying.mjs';
export const planningArticles = [...workshopArticles, ...collegeArticles, ...teachingArticles, ...buyingArticles];
