const _ = require("lodash");

async function randomSleep() {
    await sleep(_.random( 500, 1500));
}

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis))
}

async function getSelection(page, selector, multiple = false) {
    const result = await (multiple ? page.$$(selector) : page.$(selector));
    if (!result) {
        throw new Error(`Could not locate the element: ${selector}`)
    }
    return result;
}

async function moveAndClickOnPosition(elementPosition, page) {
    const {x, y, width, height} = elementPosition;

    // aim at the middle
    const xWithOffset = Math.floor(x + (width /2));
    const yWithOffset = Math.floor(y + (height /2 ))  ;

    // move the move the mouse towards it
    await page.mouse.move(xWithOffset, yWithOffset);
    await randomSleep();
    // clicks on the position
    await page.mouse.click(xWithOffset, yWithOffset)
    await randomSleep();
}

async function moveAndClickOnElement(selector, page) {
    const element = await getSelection(page, selector);
    const elementPosition = await element.boundingBox();
    await moveAndClickOnPosition(elementPosition, page)
}

async function typeTextOnElement(selector, page, value) {
    // types the text with random key press delays
    await page.type(selector, value, {delay: _.random( 120, 240)})
    await randomSleep();
}

async function navigate(page, url) {
    let response = await page.goto(url, {
        waitUntil: "networkidle2",
    });

    // waits 3 seconds for possible redirections
    await sleep(3000);

    if (response === null) {
        response = await page.waitForResponse(() => true);
    }

    return response;
}

async function removeElement(page, selector) {
    await page.evaluate((selector) => {
        document.querySelectorAll(selector).forEach(element => element.parentNode.removeChild(element));
    }, selector);
}

async function getTextValue(element) {
    const val = await element.getProperty("innerHTML").then(result => result.jsonValue());
    return val && val.trim();
}

async function getElementTextValue(parent, selector) {
    const element = await parent.$(selector)
    if (!element) {
        return "";
    }
    return getTextValue(element);
}

async function getLastElementTextValue(parent, selector) {
    const elements = await parent.$$(selector)
    const last = elements.pop();
    if (!last) {
        return "";
    }
    return getTextValue(last);
}

module.exports = {
    sleep,
    moveAndClickOnPosition,
    moveAndClickOnElement,
    typeTextOnElement,
    navigate,
    getSelection,
    randomSleep,
    removeElement,
    getLastElementTextValue,
    getElementTextValue
}