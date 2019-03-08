declare var require: any;
declare var Promise: any;

import { findIndex, values } from 'lodash';

const languages = require('../../data/languages.json');

interface Language {
  name: string;
  type: string;
  color: string;
  aliases: string[];
  interpreters: string[];
  extensions: string[];
}

const ignoredLanguages = [
  121, // GCC Machine Description
  153, // Hack
];

/**
 * Get the language of a file based on it's filename
 */
export const getLanguage = async (
  filename: string,
): Promise<Language | undefined> => {
  const extension = filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 1);
  const index = findIndex(values(languages), (lang) => {
    if (ignoredLanguages.indexOf(lang.language_id) !== -1) {
      return false;
    }
    if (lang.extensions && lang.extensions.length) {
      return lang.extensions.indexOf(extension) !== -1;
    }
    return false;
  });
  if (index === -1) {
    return undefined;
  }
  const data = values(languages)[index];
  return {
    name: Object.keys(languages)[index],
    type: data.type,
    color: data.color,
    aliases: data.aliases,
    interpreters: data.interpreters,
    extensions: data.extensions,
  };
};
