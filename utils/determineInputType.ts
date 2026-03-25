import { SourceType, TargetType } from "../types";

function isValidUrl(input: string) {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

function containsRegexMetaChars(input: string) {
  // '.'、'?' 等字符在普通 URL 中很常见，不能据此直接判定为正则。
  return /(^\^)|(\$$)|(\[[^\]]*\])|(\([^?][^)]*\))|(\(\?:)|(\|)|\\[dDsSwWbBtrnvf\\/.+*?()[\]{}|$^]/.test(input);
}

function containsCaptureGroups(input: string) {
  // 判断输入是否包含正则捕获组符号（如 \1, \2）
  return /\\\d+/.test(input); // 检查是否含有 \1, \2 等捕获组格式
}

export function determineRedirectType(userInput: string) {
  // 捕获组（如 \1、\2）必须优先判断，因为含捕获组的 URL（如 http://host/\1）
  // 能通过 new URL() 解析，但 \1 会被当作路径字符丢失，导致替换失效。
  if (containsCaptureGroups(userInput) || containsRegexMetaChars(userInput)) {
    return { type: TargetType.REGEX_SUBSTITUTION, value: userInput };
  } else if (isValidUrl(userInput)) {
    // 对绝对 URL 使用组件级重写，便于保留原始 query/hash。
    return { type: TargetType.URL, value: userInput };
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
