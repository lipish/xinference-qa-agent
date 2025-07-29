/**
 * Translation utilities for dynamic content
 */

/**
 * Translate popular question text
 * @param {string} question - The question text to translate
 * @param {function} t - The translation function from react-i18next
 * @returns {string} - Translated question text
 */
export const translatePopularQuestion = (question, t) => {
  // Try to get translation from the questions mapping
  const translatedQuestion = t(`home.popular.questions.${question}`, { defaultValue: null });
  
  // If translation exists and is different from the key, return it
  if (translatedQuestion && translatedQuestion !== `home.popular.questions.${question}`) {
    return translatedQuestion;
  }
  
  // Otherwise return the original question
  return question;
};

/**
 * Translate category text
 * @param {string} category - The category text to translate
 * @param {function} t - The translation function from react-i18next
 * @returns {string} - Translated category text
 */
export const translateCategory = (category, t) => {
  // Try to get translation from the categories mapping
  const translatedCategory = t(`home.popular.categories.${category}`, { defaultValue: null });
  
  // If translation exists and is different from the key, return it
  if (translatedCategory && translatedCategory !== `home.popular.categories.${category}`) {
    return translatedCategory;
  }
  
  // Otherwise return the original category
  return category;
};

/**
 * Translate a popular question object
 * @param {object} questionObj - The question object with question, category, etc.
 * @param {function} t - The translation function from react-i18next
 * @returns {object} - Question object with translated fields
 */
export const translatePopularQuestionObject = (questionObj, t) => {
  return {
    ...questionObj,
    question: translatePopularQuestion(questionObj.question, t),
    category: translateCategory(questionObj.category, t)
  };
};
