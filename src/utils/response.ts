// returns hundreds of response codes, e.g. 200 -> 2xx, 401 -> 4xx
export const getResponseCodeKey = (code: string) => {
  return code.startsWith('2') ? '2xx' : '4xx'
}
