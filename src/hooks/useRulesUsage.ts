import { useEffect, useState } from "react"

export function useRulesUsage() {
  const [rulesCount, setRulesCount] = useState(0)
  const [regexRulesCount, setRegexRulesCount] = useState(0)

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
    regexRulesCount,
  }
}