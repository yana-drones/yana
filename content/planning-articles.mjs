import { workshopArticles } from './planning-workshop.mjs';
import { collegeArticles } from './planning-college.mjs';
import { teachingArticles } from './planning-teaching.mjs';
import { buyingArticles } from './planning-buying.mjs';
import { clubArticles } from './planning-clubs.mjs';
import { planningNotes } from './planning-notes.mjs';
export const planningArticles = [...workshopArticles, ...collegeArticles, ...teachingArticles, ...buyingArticles, ...clubArticles].map(article => {
  const note = planningNotes[article.slug];
  if (!note) return article;
  return { ...article, sections: article.sections.map((section, index) => index === article.sections.length - 1 ? { ...section, paragraphs: [...section.paragraphs, note] } : section) };
});
