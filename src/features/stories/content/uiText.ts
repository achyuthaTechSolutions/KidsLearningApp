import { fonts } from '../../../theme/tokens';
import type { Lang, ObjectiveId } from '../engine/types';

/** Story text: the app font, then the bundled Noto Telugu and Devanagari fonts (in `fonts.body`). */
export const scriptFont = fonts.body;

/**
 * Story Time interface words. Telugu and Hindi are draft translations written for
 * this app and still need review by native speakers before release.
 * `{n}` and `{a}` are filled in by `ui()`.
 */
const strings = {
  storyTime: { en: 'Story Time', te: 'కథల సమయం', hi: 'कहानी का समय' },
  storyTimeSubtitle: { en: 'Listen, play, and learn with animal friends.', te: 'జంతు స్నేహితులతో విను, ఆడు, నేర్చుకో.', hi: 'जानवर दोस्तों के साथ सुनो, खेलो और सीखो।' },
  start: { en: 'Start the story', te: 'కథ మొదలుపెట్టు', hi: 'कहानी शुरू करो' },
  continue: { en: 'Continue', te: 'కొనసాగించు', hi: 'आगे पढ़ो' },
  playAgain: { en: 'Play again', te: 'మళ్ళీ ఆడు', hi: 'फिर से खेलो' },
  next: { en: 'Next', te: 'తర్వాత', hi: 'आगे' },
  readToMe: { en: 'Read to me', te: 'నాకు చదివి వినిపించు', hi: 'मुझे पढ़कर सुनाओ' },
  pause: { en: 'Pause', te: 'ఆపు', hi: 'रुको' },
  hearAgain: { en: 'Hear it again', te: 'మళ్ళీ విను', hi: 'फिर से सुनो' },
  replayScene: { en: 'Start this part again', te: 'ఈ భాగం మళ్ళీ మొదలుపెట్టు', hi: 'यह हिस्सा फिर से शुरू करो' },
  captions: { en: 'Words', te: 'మాటలు', hi: 'शब्द' },
  narration: { en: 'Voice', te: 'గొంతు', hi: 'आवाज़' },
  hint: { en: 'Hint', te: 'సూచన', hi: 'संकेत' },
  showMe: { en: 'Show me', te: 'నాకు చూపించు', hi: 'मुझे दिखाओ' },
  tryAgain: { en: 'Not quite. Try again!', te: 'ఇంకొంచెం. మళ్ళీ ప్రయత్నించు!', hi: 'थोड़ा और सोचो। फिर से कोशिश करो!' },
  correct: { en: 'Yes! Well done!', te: 'అవును! చాలా బాగుంది!', hi: 'हाँ! बहुत बढ़िया!' },
  moral: { en: 'The lesson', te: 'నీతి', hi: 'सीख' },
  theEnd: { en: 'The End', te: 'కథ సమాప్తం', hi: 'समाप्त' },
  backToStories: { en: 'All stories', te: 'అన్ని కథలు', hi: 'सभी कहानियाँ' },
  minutes: { en: 'About {n} minutes', te: 'సుమారు {n} నిమిషాలు', hi: 'लगभग {n} मिनट' },
  ages: { en: 'Ages {n}', te: 'వయసు {n}', hi: 'उम्र {n}' },
  finished: { en: 'Finished', te: 'పూర్తయింది', hi: 'पूरी हुई' },
  inProgress: { en: 'Keep going', te: 'కొనసాగించు', hi: 'जारी रखो' },
  language: { en: 'Language', te: 'భాష', hi: 'भाषा' },
  noVoice: { en: 'This device has no voice for this language yet, so the story shows the words.', te: 'ఈ పరికరంలో ఈ భాషకు గొంతు లేదు, అందుకే కథ మాటలను చూపిస్తుంది.', hi: 'इस डिवाइस पर इस भाषा की आवाज़ नहीं है, इसलिए कहानी शब्द दिखाएगी।' },
  whatNext: { en: 'What should happen next?', te: 'తర్వాత ఏం జరగాలి?', hi: 'आगे क्या होना चाहिए?' },
  dropPebble: { en: 'Drop a pebble', te: 'గులకరాయి వేయి', hi: 'कंकड़ डालो' },
  pebblesIn: { en: 'Pebbles in the pot: {n}', te: 'కుండలో గులకరాళ్లు: {n}', hi: 'घड़े में कंकड़: {n}' },
  canDrinkNow: { en: 'The water is high enough. Kalu can drink!', te: 'నీళ్లు సరిపడా పైకి వచ్చాయి. కాలూ తాగగలడు!', hi: 'पानी काफ़ी ऊपर आ गया। कालू पी सकता है!' },
  drinkLine: { en: 'Kalu can drink here', te: 'కాలూ ఇక్కడ తాగగలడు', hi: 'कालू यहाँ से पी सकता है' },
  moveBack: { en: 'Back one', te: 'ఒకటి వెనక్కి', hi: 'एक पीछे' },
  moveForward: { en: 'Forward one', te: 'ఒకటి ముందుకి', hi: 'एक आगे' },
  checkAnswer: { en: 'This is the spot!', te: 'ఇదే చోటు!', hi: 'यही जगह है!' },
  addOne: { en: 'Add one to {a}', te: '{a}కి ఒకటి కలుపు', hi: '{a} में एक जोड़ो' },
  groupFull: { en: 'Full!', te: 'నిండింది!', hi: 'भर गया!' },
  tapInOrder: { en: 'Tap the pictures in the order they happened.', te: 'జరిగిన వరుసలో బొమ్మలను నొక్కు.', hi: 'जिस क्रम में हुआ, उसी क्रम में तस्वीरें दबाओ।' },
  startOver: { en: 'Start over', te: 'మళ్ళీ మొదలుపెట్టు', hi: 'फिर से शुरू करो' },
  buildGraph: { en: 'Tap to add to each bar until it matches the count.', te: 'ప్రతి పట్టీ లెక్కకు సరిపోయే వరకు నొక్కి కలుపు.', hi: 'हर पट्टी गिनती के बराबर होने तक दबाकर जोड़ो।' },
  graphReady: { en: 'The graph is ready. Now answer the questions!', te: 'గ్రాఫ్ సిద్ధమైంది. ఇప్పుడు ప్రశ్నలకు జవాబు చెప్పు!', hi: 'ग्राफ़ तैयार है। अब सवालों के जवाब दो!' },
  answer: { en: 'The answer is {a}.', te: 'జవాబు {a}.', hi: 'जवाब है {a}।' },
  storyLoading: { en: 'Opening the story…', te: 'కథ తెరుచుకుంటోంది…', hi: 'कहानी खुल रही है…' },
  storyMissing: { en: 'We could not find that story.', te: 'ఆ కథ దొరకలేదు.', hi: 'वह कहानी नहीं मिली।' },
  allAges: { en: 'All ages', te: 'అన్ని వయసులు', hi: 'सभी उम्र' },
  noStories: { en: 'No stories for these ages yet.', te: 'ఈ వయసుకు ఇంకా కథలు లేవు.', hi: 'इस उम्र के लिए अभी कहानियाँ नहीं हैं।' },
  continueStory: { en: 'Continue your story', te: 'నీ కథ కొనసాగించు', hi: 'अपनी कहानी जारी रखो' },
  youWillLearn: { en: 'You will practise', te: 'నువ్వు సాధన చేసేవి', hi: 'तुम अभ्यास करोगे' },
  activity: { en: 'Activity', te: 'కార్యకలాపం', hi: 'गतिविधि' },
  age: { en: 'Age', te: 'వయసు', hi: 'उम्र' },
  numberLine: { en: 'Number line', te: 'సంఖ్యా రేఖ', hi: 'संख्या रेखा' },
  storyOrder: { en: 'Story order', te: 'కథ క్రమం', hi: 'कहानी का क्रम' },
  eventsToPlace: { en: 'Pictures to put in order', te: 'వరుసలో పెట్టాల్సిన బొమ్మలు', hi: 'क्रम में लगाने वाली तस्वीरें' },
  barGraph: { en: 'Bar graph. {a}', te: 'బార్ గ్రాఫ్. {a}', hi: 'बार ग्राफ़। {a}' },
  patternGap: { en: 'Pattern with a missing picture at the end', te: 'చివర ఒక బొమ్మ లేని నమూనా', hi: 'पैटर्न, जिसके आख़िर में एक तस्वीर नहीं है' },
  worksOffline: { en: 'Works offline', te: 'ఇంటర్నెట్ లేకుండా పనిచేస్తుంది', hi: 'बिना इंटरनेट चलती है' },
} satisfies Record<string, Record<Lang, string>>;

export type UiKey = keyof typeof strings;

export function ui(lang: Lang, key: UiKey, values: { n?: number | string; a?: string } = {}): string {
  return strings[key][lang]
    .replace('{n}', values.n === undefined ? '' : String(values.n))
    .replace('{a}', values.a ?? '');
}

export const uiKeys = Object.keys(strings) as UiKey[];
export const uiStrings = strings;

/** Learning goals in each language, for story cards. */
export const objectiveLabels: Record<ObjectiveId, Record<Lang, string>> = {
  counting: { en: 'Counting', te: 'లెక్కపెట్టడం', hi: 'गिनती' },
  comparing: { en: 'Comparing', te: 'పోల్చడం', hi: 'तुलना' },
  measurement: { en: 'Measuring', te: 'కొలవడం', hi: 'माप' },
  addition: { en: 'Adding', te: 'కూడిక', hi: 'जोड़' },
  subtraction: { en: 'Taking away', te: 'తీసివేత', hi: 'घटाना' },
  'number-line': { en: 'Number line', te: 'సంఖ్యా రేఖ', hi: 'संख्या रेखा' },
  'equal-groups': { en: 'Equal groups', te: 'సమాన గుంపులు', hi: 'बराबर समूह' },
  patterns: { en: 'Patterns', te: 'నమూనాలు', hi: 'पैटर्न' },
  sequencing: { en: 'Story order', te: 'కథ క్రమం', hi: 'कहानी का क्रम' },
  graphs: { en: 'Bar graphs', te: 'బార్ గ్రాఫ్‌లు', hi: 'बार ग्राफ़' },
  vocabulary: { en: 'New words', te: 'కొత్త పదాలు', hi: 'नए शब्द' },
  comprehension: { en: 'Understanding', te: 'అర్థం చేసుకోవడం', hi: 'समझ' },
  'cause-effect': { en: 'Cause and effect', te: 'కారణం, ఫలితం', hi: 'कारण और परिणाम' },
  prediction: { en: 'Predicting', te: 'ఊహించడం', hi: 'अनुमान लगाना' },
  values: { en: 'Values', te: 'విలువలు', hi: 'मूल्य' },
};
