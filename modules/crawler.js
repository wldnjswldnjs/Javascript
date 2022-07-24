import puppeteer from 'puppeteer-core'
import os from 'os'
import fs from 'fs'

const macUrl = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const whidowsUrl = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const currentOs = os.type()
const launchConfig = {
  headless: false,
  defaultViewport: null,
  ignoreDefaultArgs: ['--disable-extensions'],
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications', '--disable-extensions'],
  executablePath: currentOs == 'Darwin' ? macUrl : whidowsUrl
}

// 전역변수 global
const pageSelector = "body > table:nth-child(2) > tbody > tr > td:nth-child(1) > table > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(5) > td > table:nth-child(5) > tbody > tr:nth-child(4) > td > table > tbody > tr > td:nth-child(3)"

let browser = null
let page = null
let pageLength = 0
let finalData = []
let sido = null
let sigungu = null

// 실행
const launch = async function ( arg1, arg2 ) {
  sido = arg1
  sigungu = arg2

  browser = await puppeteer.launch(launchConfig);  // puppeteer 실행 함수 // 브라우저 
	const pages = await browser.pages() // 탭 확인 // browser.newPage() 하면 다른 새탭이 생긴다
	page = pages[0]
    // await page.goto('https://www.pharm114.or.kr/main.asp'); // 페이지 이동
}

const goto = async function (url) {
	return await page.goto(url) // 페이지 이동
}

const checkPopup = async function () {
	const pages = await browser.pages()
	await pages.at(-1).close() // 마지막 페이지 닫기
}

const evalCode = async function () {
	await page.evaluate(function (sido) { 
		document.querySelector(`#continents > li.${sido} > a`).click()
	}, sido)
}

const evalCity = async function () {
  // 해당 엘리먼트를 찾을 때까지 기다림
  await page.waitForSelector(`#container #continents > li.${sigungu} > a`)
  await page.evaluate(function (sigungu) {
    document.querySelector(`#container #continents > li.${sigungu} > a`).click()
  }, sigungu)
}

// alert창 닫음
const alertClose = async function () {
  return await page.on('dialog', async function (dialog) {
    // console.log('alert')
    await dialog.accept() //dialog를받음
  })
}

const getPageLength = async function () {
  // 해당 셀렉터 기다림
  await page.waitForSelector(pageSelector)

  pageLength = await page.evaluate(function (pageSelector) {
    const result = document.querySelector(pageSelector).children.length // 7
    return result
  }, pageSelector)
}

// 2페이지부터 7페이지까지일 때 for문이 돌아감
const getData = async function () {
  // 페이지 수만큼 반복
  for (let i = 1; i <= pageLength; i++) {
    // console.log('li :', i)
    await page.waitForSelector(pageSelector)

    // 1페이지 정보부터 다 가지고 온다. 그 후 for문 시작
    const infoArr = await page.evaluate(function (i, sido, sigungu) {

      // 브라우저에서 돌아가는 코드
      var trArr = document.querySelectorAll("#printZone > table:nth-child(2) > tbody tr")
      var returnData = []

      for (var i = 0; i < trArr.length; i++) {
        var currentTr = trArr[i]

        // document.querySelector("#printZone > table:nth-child(2) > tbody tr").querySelectorAll('td')
        var name = currentTr.querySelector('td')?.innerText.replaceAll('\n', '').replaceAll('\t', '') // undefine을 찾으면 error 나오는 것을 ?로 undefine 그대로 나오도록 함
        var address = currentTr.querySelectorAll('td')[2]?.innerText.replaceAll('\n', '').replaceAll('\t', '')
        var tel = currentTr.querySelectorAll('td')[3]?.innerText.replaceAll('\n', '').replaceAll('\t', '')
        var open = currentTr.querySelectorAll('td')[4]?.innerText.replaceAll('\n', '').replaceAll('\t', '')
        // var open = currentTr.querySelector('td')[4]?.innerText || '' // undefine으로 나오는 것을 공백으로 만들어줌

        var jsonData = { name, address, tel, open, sido, sigungu }

        if (jsonData.address != undefined) {
          returnData.push(jsonData) // push : array가 가진 내장함수 / array안에 데이터를 넣겠다
          console.log(jsonData)
        }
        // console.log(name, address, tel, open)
      } // end for

      return returnData

    }, i, sido, sigungu) // end eval

    finalData = finalData.concat(infoArr) // 페이지마다의 크롤링 정보가 infoArr에 들어가는 것을 finalData 변수 안에 concat해서 합쳐준다.
    console.log(finalData.length)

    if (pageLength != i) {
      // 다음 페이지로 이동
      await page.evaluate(function (i, pageSelector) {
        document.querySelector(pageSelector).children[i].click()
      }, i, pageSelector)

      await page.waitForSelector('#printZone')
    }
  } // end for
  browser.close()
} // end getData

const writeFile = async function() {
  const stringData = JSON.stringify(finalData) // 문자열로 변환

  const exist = fs.existsSync(`./json/${sido}`) // dir 존재 여부 확인 // exist : boolean
  
  // dir 만들기
  if (!exist) {
    // 정해진 문법 (참고 : https://secondmemory.kr/667)
    fs.mkdir(`./json/${sido}`, { recursive : true }, function(err) {
      console.log(err) // err 콜백 
    }) 
  }
  const filePath = `./json/${sido}/${sigungu}.json`
  await fs.writeFileSync(filePath, stringData)
}

export {
  launch,
	goto,
	checkPopup,
  evalCode,
  evalCity,
	alertClose,
  getPageLength,
  getData,
  writeFile
}