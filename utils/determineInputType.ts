import { SourceType, TargetType } from "../types";

function isValidUrl(input: string) {
  try {
    return new URL(input).toString() === input;
  } catch (e) {
    return false; // 否则不是有效的 URL
  }
}

function containsRegexMetaChars(input: string) {
  // 检查输入是否包含常见的正则表达式元字符
  const regexMetaChars = ['.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '^', '$', '|', '\\'];
  return regexMetaChars.some(char => input.includes(char));
}

function containsCaptureGroups(input: string) {
  // 判断输入是否包含正则捕获组符号（如 \1, \2）
  return /\\\d+/.test(input); // 检查是否含有 \1, \2 等捕获组格式
}

export function determineRedirectType(userInput: string) {
  if (isValidUrl(userInput)) {
    // 如果是有效的 URL，使用 url 参数
    return { type: TargetType.URL, value: userInput };
  } else if (containsRegexMetaChars(userInput) || containsCaptureGroups(userInput)) {
    // 如果包含正则元字符或捕获组，使用 regexSubstitution 参数
    return { type: TargetType.REGEX_SUBSTITUTION, value: userInput };
  } else {
    // 如果输入不符合上述条件，可以认为它是一个普通的字符串（例如相对路径）
    return { type: TargetType.URL, value: userInput };
  }
}

export function determineFilterType(userInput: string) {
  // 判断用户输入的类型
  if (isValidUrl(userInput)) {
    // 如果是有效的 URL，使用 urlFilter
    return { type: SourceType.URL_FILTER, value: userInput };
  } else if (containsRegexMetaChars(userInput)) {
    // 如果包含正则元字符，使用 regexFilter
    return { type: SourceType.REGEX_FILTER, value: userInput };
  } else {
    // 否则认为它是一个普通的字符串（如路径），使用 urlFilter
    return { type: SourceType.URL_FILTER, value: userInput };
  }
}