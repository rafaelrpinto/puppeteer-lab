const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");

const { username, password } = require("./credentials");
const {
    sleep,
    moveAndClickOnElement,
    typeTextOnElement,
    navigate,
    randomSleep,
    getSelection,
    moveAndClickOnPosition,
    removeElement,
    getLastElementTextValue,
    getElementTextValue
} = require("./common");

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin());


async function login(page, username, password) {
    console.log(`Logging into the account: ${username}`)
    // fills in the username
    const usernameSelector = "#username";
    await moveAndClickOnElement(usernameSelector, page)
    await typeTextOnElement(usernameSelector, page, username);

    // fills in the password
    const passwordSelector = "#password";
    await moveAndClickOnElement(passwordSelector, page)
    await typeTextOnElement(passwordSelector, page, password);

    // click on the login button
    const loginButtonSelector = "button[type='submit' i][aria-label='Sign in' i]";
    await moveAndClickOnElement(loginButtonSelector, page)

    await sleep(5000);
}

async function getLatestMessages(page) {
    // finds the message cards
    let messageCards = await getSelection(page, ".msg-conversation-listitem", true);
    // keeps 5 of them
    messageCards = messageCards.slice(0, 5);

    const messages = [];

    for(const messageCard of messageCards) {
        const position = await messageCard.boundingBox();
        await moveAndClickOnPosition(position, page)
        await randomSleep();

        // make sure all docked conversations are removed to not interfere on the scraping
        // lets do this on all iterations just to be safe
        await Promise.all([
            removeElement(page, ".msg-overlay-conversation-bubble"),
            removeElement(page, "msg-overlay-list-bubble")
        ])

        const [name, lastMessage] = await Promise.all([
            getElementTextValue(messageCard, ".msg-conversation-listitem__participant-names"),
            getLastElementTextValue(page, ".msg-s-event-listitem__body")
        ]);

        messages.push({name, lastMessage})
    }

    return messages;
}

(async() => {
    const browserArgs = {
        headless: false,
        ignoreHTTPSErrors: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--no-first-run",
            // make sure this folder exists
            `--user-data-dir=/tmp/pptuser`
        ]
    };

    const browser = await puppeteer.launch(browserArgs);
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(30000);
    await page.setViewport({ width: 1366, height: 768 });

    // goes to linkedin messages page
    let response = await navigate(page, "https://www.linkedin.com/messaging");

    if (page.url().indexOf("/login") !== -1) {
        // logs in if necessary
        await login(page, username, password);
    }

    if (page.url().indexOf("/messaging") === -1) {
        throw new Error(`We were redirected to an unknown page: ${page.url()}`);
    }

    const latestMessages = await getLatestMessages(page);

    console.log(JSON.stringify(latestMessages, null, 4));

    browser.close();
})();
