// =============================================================================
// THE ACTIVITY: "Your turn: push a Feature to Jira". All the words live here.
// Edit the text between the quotes; no code knowledge needed.
//
// Each step has:
//   device     which screen it happens on: 'monitor' (Targetprocess) or 'laptop' (Jira)
//   screen     the picture on that screen when the step starts (see SCREENS below)
//   question   what the learner is asked
//   choices    the answers. Exactly one has  correct: true.
//              feedback  what the learner reads after choosing it
//              playout   what happens on screen when it is chosen (see "Playout actions")
//   clue       a hint. Pressing Clue a second time highlights the right spot on the screen.
//   narration  what the walkthrough says while doing the step
//
// Playout actions:   ['cursor', 'pointName']  move the cursor to a spot
//                    ['click']                 click where the cursor is
//                    ['show', 'screenId']      change the picture on this step's screen
//                    ['highlight', 'pointName'] ring a spot
//                    ['fly', 'monitor' | 'laptop']  move the camera to that screen
//                    ['laptop', 'screenId']    change the picture on the laptop
//                    ['wait', seconds]
// =============================================================================

export const ACTIVITY = {
  title: 'Your turn: push a Feature to Jira',
  intro: 'The Feature “Tokenized checkout” sits under the Strategic Epic “Payments Modernization”. Send it to Jira Cloud and check that the link works. This demo assumes an enabled integration, Feature-to-Epic mapping and PAY routing. Answer each step; you will see it happen on the screens.',
  finish: 'Practice complete. In this simulation you pushed one Feature to Jira as a new Epic, linked another to an Epic that already existed, and checked where each link shows. In your real tools, what syncs depends on the enabled integration profile and filter rules.',
};

// the pictures (from assets/tool-screens/recreations/) and the spots on them, as fractions of the
// screen: [left, top, width, height]. "cover" hides a part of a picture (for an earlier state).
export const SCREENS = {
  epic:      { file: '01-targetprocess_portfolio-epic.png', cover: [[0.618, 0.378, 0.075, 0.034]],   // hide PAY-142: not pushed yet
               points: { featureRow: [0.085, 0.375, 0.17, 0.042], syncedTab: [0.297, 0.232, 0.072, 0.034], features: [0.08, 0.31, 0.63, 0.32] } },
  synced:    { file: '07-targetprocess_synced-work.png',
               points: { syncedTab: [0.30, 0.22, 0.07, 0.06], push: [0.10, 0.43, 0.10, 0.05], linkExisting: [0.21, 0.43, 0.11, 0.05], status: [0.10, 0.37, 0.2, 0.04] } },
  linked:    { file: '07b-targetprocess_synced-work-linked.png',
               points: { linked: [0.10, 0.38, 0.59, 0.04], syncedTab: [0.30, 0.22, 0.07, 0.06] } },
  board:     { file: '08-targetprocess_features-board.png',
               points: { extId: [0.46, 0.22, 0.08, 0.03], extId2: [0.165, 0.222, 0.06, 0.03] } },
  settings:  { file: '03-targetprocess_integrations.png', points: {} },
  jiraEpic:  { file: '02-jira_epic.png', points: {} },
  // round 2: a different Feature (Fraud scoring API), already in Jira as PAY-160
  synced2:   { file: '07-targetprocess_synced-work.png',
               text: [[0.25, 0.021, 0.13, 0.03, 'Fraud scoring API', 800], [0.075, 0.148, 0.3, 0.05, 'Fraud scoring API', 800]],
               points: { push: [0.10, 0.43, 0.10, 0.05], linkExisting: [0.21, 0.43, 0.11, 0.05], status: [0.10, 0.37, 0.2, 0.04] } },
  linked2:   { file: '07b-targetprocess_synced-work-linked.png',
               text: [[0.25, 0.021, 0.13, 0.03, 'Fraud scoring API', 800], [0.075, 0.148, 0.3, 0.05, 'Fraud scoring API', 800], [0.1085, 0.3885, 0.06, 0.028, 'PAY-160', 700, '#2558C9', 'Consolas, "Cascadia Mono", monospace']],
               points: { linked: [0.10, 0.38, 0.59, 0.04] } },
  actions:   { file: '10b-targetprocess_actions-menu.png',
               text: [[0.25, 0.021, 0.13, 0.03, 'Fraud scoring API', 800], [0.075, 0.148, 0.3, 0.05, 'Fraud scoring API', 800], [0.1085, 0.3885, 0.06, 0.028, 'PAY-160', 700, '#2558C9', 'Consolas, "Cascadia Mono", monospace']],
               points: { pushUpd: [0.5, 0.4445, 0.19, 0.0547], pullUpd: [0.5, 0.4992, 0.19, 0.0547], unlink: [0.5, 0.5658, 0.19, 0.0547], menu: [0.4992, 0.4352, 0.1917, 0.1947] } },
  jiraIssue: { file: '13-jira_synced-issue.png',
               points: { activity: [0.19, 0.36, 0.54, 0.11], key: [0.40, 0.10, 0.05, 0.03], reporter: [0.775, 0.155, 0.13, 0.05], labels: [0.775, 0.235, 0.1, 0.05] } },
};
export const START = { monitor: 'epic', laptop: 'jiraEpic' };

export const STEPS = [
  {
    device: 'monitor', screen: 'epic',
    question: 'You are on the Strategic Epic “Payments Modernization”. Where do you start pushing “Tokenized checkout” to Jira?',
    choices: [
      { text: 'Open the Feature “Tokenized checkout”', correct: true,
        feedback: 'Right. Each Feature is pushed from its own page, so you open the Feature first.',
        playout: [['cursor', 'featureRow'], ['click'], ['show', 'synced']] },
      { text: 'Use the Epic’s own Synced Work tab',
        feedback: 'Not quite. The Epic’s Synced Work tab shows it is linked through its child Features. To push a Feature, open that Feature.',
        playout: [['cursor', 'syncedTab'], ['click'], ['highlight', 'features']] },
      { text: 'Go to Settings › Integrations',
        feedback: 'Not here. Settings › Integrations is where admins set up the Jira profile. You push work from the item itself.',
        playout: [['show', 'settings'], ['wait', 1.2], ['show', 'epic']] },
    ],
    clue: 'Work items are pushed one at a time, from the item’s own page.',
    hint: 'featureRow',
    narration: 'Start on the Strategic Epic, and open the Feature you want to send: Tokenized checkout.',
  },
  {
    device: 'monitor', screen: 'synced',
    question: 'The Feature’s Synced Work tab says “This Feature is not linked to Jira yet”. Nothing exists in Jira for it. Which button do you press?',
    choices: [
      { text: 'Push as new', correct: true,
        feedback: 'Yes. Push as new creates the matching Epic in Jira Cloud and links the two.',
        playout: [['cursor', 'push'], ['click'], ['show', 'linked'], ['highlight', 'linked']] },
      { text: 'Link to Existing',
        feedback: 'Not this time. Link to Existing attaches a Jira issue that already exists. There isn’t one yet, so you would have nothing to pick.',
        playout: [['cursor', 'linkExisting'], ['click'], ['highlight', 'status']] },
      { text: 'Ask a Jira admin to create the Epic, then come back',
        feedback: 'That adds work and risks a duplicate. The integration creates the Jira Epic for you.',
        playout: [['highlight', 'status']] },
    ],
    clue: 'The item doesn’t exist in Jira yet, so you want the button that creates it there.',
    hint: 'push',
    narration: 'On the Synced Work tab it says the Feature is not linked yet, so choose Push as new.',
  },
  {
    device: 'monitor', screen: 'linked',
    question: 'The Synced Work tab now shows a linked Jira item. How do you confirm it worked?',
    choices: [
      { text: 'Look for its Jira key (the External ID, e.g. PAY-142) on the Feature', correct: true,
        feedback: 'Correct. Every synced card carries its Jira key. Seeing PAY-142 means the link exists.',
        playout: [['show', 'board'], ['cursor', 'extId'], ['highlight', 'extId']] },
      { text: 'Press Push as new again, to be sure',
        feedback: 'Careful: pushing again can create a duplicate in Jira. The linked line already shows it worked.',
        playout: [['highlight', 'linked']] },
      { text: 'Wait for a confirmation email from Jira',
        feedback: 'No email is needed. The proof is on the card: its Jira key, the External ID.',
        playout: [['highlight', 'linked']] },
    ],
    clue: 'The proof is on the Feature itself: a short code that starts with the Jira project key.',
    hint: 'linked',
    narration: 'The Feature now shows its Jira key, PAY-142. That External ID is your proof the link exists.',
  },
  {
    device: 'monitor', screen: 'board',
    question: 'Check it in Jira. What is the quickest way to open the exact Jira item?',
    choices: [
      { text: 'Click the Jira key PAY-142 on the card', correct: true,
        feedback: 'Exactly. The External ID is a link: it opens the right Jira issue directly.',
        playout: [['cursor', 'extId'], ['click'], ['fly', 'laptop'], ['laptop', 'jiraIssue']] },
      { text: 'Search Jira for “Tokenized checkout”',
        feedback: 'That can work, but it is slower and you might open the wrong issue. The key on the card opens the exact one.',
        playout: [['fly', 'laptop'], ['wait', 1], ['fly', 'monitor']] },
    ],
    clue: 'The Jira key on the card isn’t just a label.',
    hint: 'extId',
    narration: 'Click the Jira key on the card. It opens the exact issue in Jira, here on the laptop.',
  },
  {
    device: 'laptop', screen: 'jiraIssue',
    question: 'You are in Jira on PAY-142. Where can you see that it came from Targetprocess?',
    choices: [
      { text: 'Activity: “created this issue from Targetprocess Feature #4121”', correct: true,
        feedback: 'Right. The Activity shows the integration created the issue from Feature #4121, and identifies Targetprocess as the source. Updates depend on the enabled integration profile and filter rules.',
        playout: [['cursor', 'activity'], ['highlight', 'activity']] },
      { text: 'The Reporter field',
        feedback: 'Close. The Reporter is the Integration user, a good sign, but the Activity names the exact Targetprocess Feature.',
        playout: [['cursor', 'reporter'], ['highlight', 'reporter']] },
      { text: 'The Labels field',
        feedback: 'Labels are just tags here. Look at the Activity: it records where the issue came from.',
        playout: [['cursor', 'labels'], ['highlight', 'labels']] },
    ],
    clue: 'Look for the history of the issue: who created it, and from where.',
    hint: 'activity',
    narration: 'In Jira, the Activity shows the issue was created from Targetprocess Feature 4121. That confirms where it came from.',
  },
  // ---------------- ROUND 2: your judgement (a different Feature, a different situation) ----------------
  // Draft wording by Claude, approved in principle by Lorne (2026-11-02); ChatGPT to refine.
  {
    round: 2, roundIntro: 'Round 2: your judgement. A different Feature, a different situation.',
    device: 'monitor', screen: 'synced2',
    question: 'The delivery team already created a Jira Epic for “Fraud scoring API” (PAY-160). You want this Feature connected to it. Which button?',
    choices: [
      { text: 'Link to Existing', correct: true,
        feedback: 'Yes. The Jira Epic already exists, so you attach the Feature to it. One item in each tool, linked.',
        playout: [['cursor', 'linkExisting'], ['click'], ['show', 'linked2'], ['highlight', 'linked']] },
      { text: 'Push as new',
        feedback: 'Careful: that would create a second Epic in Jira alongside the one the team already made: a duplicate.',
        playout: [['cursor', 'push'], ['highlight', 'push']] },
      { text: 'Ask the Jira team to delete their Epic first',
        feedback: 'No need to lose their work. The integration can connect to an Epic that already exists.',
        playout: [['highlight', 'status']] },
    ],
    clue: 'Ask yourself: does a matching item already exist in Jira?',
    hint: 'linkExisting',
    narration: 'The Jira Epic already exists, so choose Link to Existing. No duplicate.',
  },
  {
    device: 'monitor', screen: 'actions',
    question: 'Later, someone chooses Unlink on a Feature that still matches your auto-push filters. What can happen next?',
    choices: [
      { text: 'It can be pushed again as new, creating a duplicate in Jira', correct: true,
        feedback: 'Right. If it still matches the filters, auto-push can send it again as new. Fix the filters before unlinking.',
        playout: [['cursor', 'unlink'], ['highlight', 'unlink']] },
      { text: 'Nothing: unlinking also deletes the Jira item',
        feedback: 'Unlinking breaks the connection; it doesn’t delete anything in Jira. The Feature can then be pushed again.',
        playout: [['cursor', 'unlink'], ['highlight', 'unlink']] },
      { text: 'Jira re-links it automatically',
        feedback: 'There is no automatic re-link. What can happen is a fresh push: a duplicate.',
        playout: [['cursor', 'unlink'], ['highlight', 'unlink']] },
    ],
    clue: 'Think about what auto-push does with an unlinked item that still matches your filters.',
    hint: 'unlink',
    narration: 'Watch out: unlinking an item that still matches your filters lets auto-push send it again, as a duplicate.',
  },
  {
    device: 'monitor', screen: 'board',
    question: 'Back on the board. How do you know “Fraud scoring API” is now linked to the right Jira Epic?',
    choices: [
      { text: 'Its card shows the Jira key PAY-160', correct: true,
        feedback: 'Exactly. The External ID on the card names the Jira Epic it is linked to, here PAY-160.',
        playout: [['cursor', 'extId2'], ['highlight', 'extId2']] },
      { text: 'It moved to the In Progress column',
        feedback: 'The column is its state, not its link. The link shows as the Jira key on the card.',
        playout: [['highlight', 'extId2']] },
    ],
    clue: 'The proof sits on the card itself: a short code.',
    hint: 'extId2',
    narration: 'The card shows PAY-160, the Epic the team already had. Linked, with no duplicate.',
  },
];

// =============================================================================
// THE JOURNEY: film → explainer → your turn → review. Words and video sources.
// =============================================================================
export const JOURNEY = {
  stages: ['Watch', 'Your turn', 'Conclusion', 'Complete'],
  // the cover: a website-style hero
  landing: {
    brand: 'Enterprise Technology Services',
    kicker: 'Tools training · Targetprocess ↔ Jira Cloud',
    title: 'Push a Feature to Jira',
    lede: 'Watch the steps. Practise the connection.',
    meta: ['About 10 minutes', '4 parts', 'Captions on'],
    image: 'images/hero-workstation.jpg',   // rendered in the current room (PLAN's office, glass and adjoining desks)
    imageAlt: 'A desk in a bright American Express office: a monitor showing Targetprocess and a laptop showing Jira, with the open-plan office beyond the glass',
    parts: [
      ['Watch', '3:57', 'The full film: how Strategic Epics, Features and Jira fit together.'],
      ['Explainer', '0:39', 'The exact steps you are about to do, in under a minute.'],
      ['Your turn', '2 rounds', 'Do it yourself in the office, with clues when you want them.'],
      ['Review', '1 min', 'What you learned, in six points.'],
    ],
    footnote: 'Tool screens are illustrative recreations with demo data.',
  },
  // the full film is served from the Watch page (same site, so captions work)
  film: { src: 'https://lorneh12.github.io/linking-strategic-epics-watch/video/linking-strategic-epics.mp4',
          captions: 'https://lorneh12.github.io/linking-strategic-epics-watch/video/linking-strategic-epics.en.vtt',
          poster: 'https://lorneh12.github.io/linking-strategic-epics-watch/images/poster.jpg', minutes: '3:57' },
  explainer: { src: '../explainer/explainer-web.mp4', seconds: 39,
               intro: 'Next: the 39-second version of the task you are about to do.' },
};

// the review at the end: what has been learned (from the film and the activity)
export const REVIEW = {
  title: 'What you learned',
  points: [
    ['The hierarchy', 'A Strategic Epic sits at the top. Its Features in Targetprocess pair with Epics in Jira, and stories travel through the Feature.'],
    ['Push from the item', 'Open the Feature itself and go to its Synced Work tab. Settings › Integrations is for admins setting up the profile.'],
    ['Push as new or Link to Existing', 'Push as new creates the matching Epic in Jira. Link to Existing is only for a Jira issue that already exists.'],
    ['The External ID is your proof', 'The Jira key on the card (e.g. PAY-142) shows the link exists, and clicking it opens the exact Jira issue.'],
    ['Jira shows where it came from', 'The issue’s Activity says it was created from the Targetprocess Feature. Updates follow your enabled integration profile and filter rules.'],
    ['Watch-out', 'Unlinking an item that still matches enabled auto-push filters can push a duplicate. Fix the filters first.'],
  ],
};
