import { useEffect, useState } from "react"
import { red, yellow, green } from "@ant-design/colors"

const conicColors = {
  '0%': green[5],
  '50%': yellow[5],
  '100%': red[5],
};

export function useRulesUsage() {
  const [rulesCount, setRulesCount] = useState(0)
  const [regexRulesCount, setRegexRulesCount] = useState(0)
  const { MAX_NUMBER_OF_DYNAMIC_RULES, MAX_NUMBER_OF_REGEX_RULES } = chrome.declarativeNetRequest as any;

  const rulesFormat = (percent?: number | undefined) => {
    return `${chrome.i18n.getMessage('dynamic_rules')} ${Math.max(percent || 0, 1).toFixed(0)}% | ${rulesCount} / ${MAX_NUMBER_OF_DYNAMIC_RULES}`
  }

  const regexRulesFormat = (percent?: number | undefined) => {
    return `${chrome.i18n.getMessage('regex_rules')} ${Math.max(percent || 0, 1).toFixed(0)}% | ${regexRulesCount} / ${MAX_NUMBER_OF_REGEX_RULES}`
  }

  useEffect(() => {
    const countEnabledRules = () => {
      chrome.declarativeNetRequest.getDynamicRules().then((rules: chrome.declarativeNetRequest.Rule[]) => {
        setRulesCount(rules.length)
        setRegexRulesCount(rules.filter((rule) => rule.condition.regexFilter).length)
      })
    }

    // 初始化时计算一次
    countEnabledRules()

    // 监听规则变化重新计算
    chrome.storage.onChanged.addListener(countEnabledRules)
    return () => {
      chrome.storage.onChanged.removeListener(countEnabledRules)
    }
  }, [])

  return {
    rulesCount,
    rulesCountPercent: (rulesCount / MAX_NUMBER_OF_DYNAMIC_RULES) * 100,
    regexRulesCount,
    regexRulesCountPercent: (regexRulesCount / MAX_NUMBER_OF_REGEX_RULES) * 100,
    rulesFormat,
    regexRulesFormat,
    conicColors
  }
}