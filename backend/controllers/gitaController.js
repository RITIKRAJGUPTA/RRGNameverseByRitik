const shlokas = [
  {
    shlok: "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः |",
    meaning: "In the field of righteousness, in the field of the Kurus, gathered together, eager to fight..."
  },
  {
    shlok: "सञ्जय उवाच | दृष्ट्वा तु पाण्डवानीकं व्यूढं दुर्योधनस्तदा |",
    meaning: "Sanjaya said: Seeing the army of the Pandavas arranged in battle formation, King Duryodhana approached his teacher."
  },
  {
    shlok: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन |",
    meaning: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions."
  },
  {
    shlok: "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय |",
    meaning: "Perform your duties established in yoga, abandoning attachment, O Dhananjaya (Arjuna)."
  },
  {
    shlok: "न हि कश्चित्क्षणमपि जातु तिष्ठत्यकर्मकृत् |",
    meaning: "No one can remain inactive even for a moment."
  },
  {
    shlok: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत |",
    meaning: "Whenever there is a decline in righteousness, O Bharata (Arjuna)..."
  },
  {
    shlok: "मद्भक्तः संस्तभ्य मां सर्वभूमि: पालयते |",
    meaning: "My devotee, seeking refuge in Me, protects all beings on earth."
  },
  {
    shlok: "तस्मादसक्तः सततं कार्यं कर्म समाचर |",
    meaning: "Therefore, without attachment, always perform the work that must be done."
  },
  {
    shlok: "श्रीभगवानुवाच | अशोच्यानन्वशोचस्त्वं प्रज्ञावादांश्च भाषसे |",
    meaning: "The Blessed Lord said: You speak words of wisdom yet lament for what is not worthy of grief."
  },
  {
    shlok: "मयि सर्वाणि कर्माणि संन्यस्याध्यात्मचेतसा |",
    meaning: "With your mind focused on Me, abandon all actions and surrender the fruits to Me."
  },
  {
    shlok: "इन्द्रियाणि मनसा नियम्यारभते नरः स्मृति: |",
    meaning: "By restraining the senses with the mind, a person remembers the Self."
  },
  {
    shlok: "दुःखेष्वनुद्विग्नमना: सुखेषु विगतस्पृह: |",
    meaning: "One who is undisturbed in distress, free from desire in pleasure..."
  },
  {
    shlok: "योगिनामपि सर्वेषां मद्गतेनान्तरात्मना |",
    meaning: "Among all yogis, he who always abides in Me with the inner self..."
  },
  {
    shlok: "मनः प्रसादात्परां शान्तिमधिगच्छति |",
    meaning: "By the tranquility of mind, one attains supreme peace."
  },
  {
    shlok: "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज |",
    meaning: "Abandon all varieties of dharma and surrender unto Me alone."
  },
  {
    shlok: "क्लेशोऽधिकतरस्तेषामव्यथा: सदापि ते |",
    meaning: "For them, the pain is greater, yet they remain unaffected."
  },
  {
    shlok: "नित्यसंन्यस्तकर्मा तपस्वी मद्योगरीता: |",
    meaning: "Constantly performing selfless actions, the yogis are absorbed in Me."
  },
  {
    shlok: "एवं बुद्धिमतामिच्छामि वेत्ति तं प्रथितं पुरुषम् |",
    meaning: "The enlightened ones see the supreme person within the intellect."
  },
  {
    shlok: "श्रेयान्स्वधर्मो विगुण: परधर्मात्स्वनुष्ठितात् |",
    meaning: "Better is one's own duty, though imperfect, than the duty of another well performed."
  },
  {
    shlok: "आत्मौपम्येन सर्वत्र समं पश्यति योऽर्जुन |",
    meaning: "O Arjuna, he who sees all beings as equal to the self is wise."
  }
];


const getDailyShlok = (req, res) => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const index = dayOfYear % shlokas.length;
  res.json(shlokas[index]);
};

module.exports = { getDailyShlok };
