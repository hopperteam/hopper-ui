import {Given, When, Then, AfterAll} from 'cucumber'
import {Actions, Builder, By, Capabilities, Key, until, WebElement, WebElementPromise} from 'selenium-webdriver';
import { expect } from 'chai';
import HopperAdapter from "./hopperAdapter";

require("chromedriver");

// driver setup
const capabilities = Capabilities.chrome();
capabilities.set('chromeOptions',
    {
        "w3c": false,
        'args': ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox', '-headless'],
    }
);
capabilities.set('resolution', "1920x1080");
const driver = new Builder().withCapabilities(capabilities).build();
let adapter = new HopperAdapter();

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

Given(/^User is on hopper$/, async function () {
    await driver.manage().deleteAllCookies();
    (await driver.manage().getTimeouts()).implicit = 2 * 1000;
    await driver.get("http://localhost:8080/?dummy")
});

Given(/^User is logged in$/, async function () {
    await driver.wait(until.elementLocated(By.id('notificationContainer')), 2 * 1000);
    adapter = new HopperAdapter();
    await adapter.setup(driver);
});

Given(/^User has open Notification "([^"]*)" by "([^"]*)"$/, async function (name, sender) {
    await adapter.insertNotification(driver, name, sender);
});

Given(/^No AppFilter is selected$/, async function () {
    let sel = await driver.findElements(By.className("appFilter:not(appFilterNotSelected)"));
    if (sel.length == 1) {
        await driver.executeScript("arguments[0].scrollIntoView()", sel[0]);
        await sel[0].click()
    }
    await sleep(200);
});
Given(/^AppFilter "([^"]*)" is selected$/, async function(filter) {
    let id = await adapter.getAppId(filter, driver);
    let el = driver.findElement(By.id('app-' + id));
    await driver.executeScript("arguments[0].scrollIntoView()", el);
    await sleep(1000);
    try {
        await el.click();
    } catch (e) {console.log("Could not click!")}
    await sleep(2000);
});

Given(/^Checkbox "([^"]*)" is( not)? checked$/, async function (checkbox, not) {
    let box = undefined;

    switch (checkbox) {
        case "SeeAllNotifications":
            box = await driver.findElement(By.id("includeDoneSelectorLabel"));
            break;
        default:
            expect.fail("Unknown checkbox!");
    }
    if (await box!.isSelected()) {
        if (not != undefined) {
            await box!.click()
        }
    } else {
        if (not == undefined) {
            await box!.click()
        }
    }
});

When(/^User clicks on button "([^"]*)" in Notification "([^"]*)"$/, async function (button, notification) {
    await sleep(1000);
    let id = adapter.getNotificationId(notification);
    let el = driver.findElement(By.id('not-' + id));
    let buttonEl: WebElement|undefined;
    switch (button) {
        case "done":
            buttonEl = await el.findElement(By.className("markDoneButton"));
            break;
        default:
            expect.fail("Unknown checkbox!");
    }
    expect(buttonEl).not.to.be.undefined;

    await buttonEl!.click();
    await sleep(1000);
});

When(/^User clicks on AppFilter "([^"]*)"$/, async function (filter) {
    let id = await adapter.getAppId(filter, driver);
    let el = driver.findElement(By.id('app-' + id));
    await driver.executeScript("arguments[0].scrollIntoView()", el);
    try {
        await el.click();
    } catch (e) {console.log("Could not click!")}
    await sleep(2000);
});

Then(/^Notification "([^"]*)" should be done$/, async function (name) {
    let isDone = await adapter.isNotificationDone(driver, name);
    expect(isDone).to.equal(true);
});
Then(/^Notification "([^"]*)" should( not)? be visible$/, async function (name, not) {
    let id = await adapter.getNotificationId(name);
    if (not != undefined) {
        let el = await driver.findElements(By.id('not-' + id));
        if (el.length > 1) expect.fail("Notification is visible!");
        return;
    }
    try {
        await driver.findElement(By.id('not-' + id));
    } catch (e) {}

});

Then(/^AppFilter "([^"]*)" should( not)? be selected$/, async function (filter, not) {
    let id = await adapter.getAppId(filter, driver);
    let el = driver.findElement(By.id('app-' + id));
    let classes = await el.getAttribute("class");
    if (not == undefined)
        expect(classes).not.to.contain("appFilterNotSelected");
    else
        expect(classes).to.contain("appFilter");
});

AfterAll('end', async function(){
    await driver.quit();
});
