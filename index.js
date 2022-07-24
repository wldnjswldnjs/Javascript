import { launch, goto, checkPopup, alertClose, evalCode, evalCity, getPageLength, getData, writeFile } from './modules/crawler.js' // crawler.js에서 export한 것들을 가져온다.

async function main() {
  await launch('kangwon', 'gangneung') // 브라우저 실행
  await goto('https://www.pharm114.or.kr/main.asp') // 링크 열기

  await checkPopup()
  await evalCode()
  await evalCity()
  await alertClose()
  await getPageLength()
  await getData()
  await writeFile()

  process.exit(1)
}

main()