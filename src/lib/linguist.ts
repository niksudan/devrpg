import { findIndex, values } from 'lodash';

const languages = require('../data/languages.json');

interface Language {
  name: string;
  type: string;
  color: string;
  aliases: string[];
  interpreters: string[];
  extensions: string[];
}

export const getLanguage = async (filename: string): Promise<Language> => {
  const extension = filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 1);
  const index = findIndex(values(languages), (lang) => {
    if (lang.extensions && lang.extensions.length) {
      return lang.extensions.indexOf(extension) !== -1;
    }
    return false;
  });
  if (index === -1) {
    return null;
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
