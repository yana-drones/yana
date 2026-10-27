export const refs = {
  atl: { title: 'Atal Innovation Mission: ATL curriculum and drone module', url: 'https://aim.gov.in/atl-curriculum.php' },
  cdio: { title: 'CDIO Initiative: engineering education syllabus', url: 'https://www.cdio.org/knowledge-library/cdio-syllabus' },
  standards: { title: 'CDIO Initiative: design-build experiences and active learning', url: 'https://www.cdio.org/content/cdio-standards-10' },
  design: { title: 'Cornell: designing a course around learning outcomes', url: 'https://teaching.cornell.edu/teaching-resources/preparing-teach/designing-your-course' },
  outcomes: { title: 'Cornell: setting learning outcomes', url: 'https://teaching.cornell.edu/setting-learning-outcomes' },
  groups: { title: 'Cornell: designing group work assignments', url: 'https://teaching.cornell.edu/resource/getting-started-designing-group-work-assignments' },
  assess: { title: 'Cornell: evaluating group work', url: 'https://teaching.cornell.edu/teaching-resources/active-collaborative-learning/collaborative-learning/how-evaluate-group-work' },
  peer: { title: 'Cornell: peer assessment', url: 'https://teaching.cornell.edu/teaching-resources/assessing-student-learning/peer-assessment' },
  nasa: { title: 'NASA: engineering design process learning resource', url: 'https://www.nasa.gov/stem-content/stemonstrations-engineering-design-process/' },
  setup: { title: 'ArduPilot: first-time Copter setup', url: 'https://ardupilot.org/copter/docs/initial-setup.html' },
  hardware: { title: 'ArduPilot: mandatory hardware configuration', url: 'https://ardupilot.org/copter/docs/configuring-hardware.html' },
  controller: { title: 'ArduPilot: choosing an autopilot', url: 'https://ardupilot.org/copter/docs/common-autopilots.html' },
  firmware: { title: 'ArduPilot: loading firmware and version changes', url: 'https://ardupilot.org/copter/docs/common-loading-firmware.html' },
  safety: { title: 'ArduPilot: multicopter safety', url: 'https://ardupilot.org/copter/docs/safety-multicopter.html' },
  logs: { title: 'ArduPilot: log types and analysis tools', url: 'https://ardupilot.org/copter/docs/common-logs.html' },
  logreview: { title: 'ArduPilot: downloading and analysing data logs', url: 'https://ardupilot.org/copter/docs/common-downloading-and-analyzing-data-logs-in-mission-planner.html' },
  messages: { title: 'ArduPilot: onboard log message definitions', url: 'https://ardupilot.org/copter/docs/logmessages.html' },
  sitl: { title: 'ArduPilot: software-in-the-loop simulator', url: 'https://ardupilot.org/dev/docs/sitl-simulator-software-in-the-loop.html' },
  sitluse: { title: 'ArduPilot: using SITL for testing', url: 'https://ardupilot.org/dev/docs/using-sitl-for-ardupilot-testing.html' },
  planner: { title: 'ArduPilot: Mission Planner initial setup', url: 'https://ardupilot.org/planner/docs/mission-planner-initial-setup.html' },
  connect: { title: 'ArduPilot: connecting Mission Planner to an autopilot', url: 'https://ardupilot.org/copter/docs/common-connect-mission-planner-autopilot.html' },
};
export function article(category, data) {
  return {
    slug: data.slug, title: data.title, description: data.description, category,
    answer: data.answer,
    sections: data.sections.map(([heading, paragraphs], i) => ({ heading, paragraphs: Array.isArray(paragraphs) ? paragraphs : [paragraphs], ...(i === data.sections.length - 1 ? { list: data.checklist } : {}) })),
    activity: { title: data.activity[0], steps: data.activity.slice(1) },
    faqs: data.faqs.map(([q, a]) => ({ q, a })),
    sources: data.sources.map(key => refs[key]), related: data.related,
  };
}
