import * as React from "react";
import * as ReactDOM from 'react-dom';
import {User} from "types";
import {NotificationSet} from "notificationSet"
import MainView from "components/mainView";
import LoadingView from "components/loadingView";
import LoadingController from "loadingController";
import DummyHopperApi from "api/dummyHopperApi";
import SerializationUtil from "./serializationUtil";
import {IHopperApi, HopperApi, isHopperError, ERROR_UNAUTHENTICATED} from "./api/hopperApi";

import "style/app.scss";
import {WebSocketAdapter} from "./api/webSocketAdapter";

const UPDATE_INTERVAL = 30000;

function renderLoadingView() {
    ReactDOM.render(
        <LoadingView />,
        document.getElementById("root")
    );
}

function renderError(error: string) {
    ReactDOM.render(
        <p>Error: {error}</p>,
        document.getElementById("root")
    );
}

function updateView(user: User, notifications: NotificationSet, loadingController: LoadingController) {
    ReactDOM.render(
        <MainView onClickLogout={navigateToLogin} user={user} notifications={notifications} loadingController={loadingController} />,
        document.getElementById("root")
    );
    setTimeout(() => {
        updateView(user, notifications, loadingController);
    });
}

function updateLoop(user: User, notifications: NotificationSet, loadingController: LoadingController) {
    setTimeout(() => updateLoop(user, notifications, loadingController), UPDATE_INTERVAL);
    updateView(user, notifications, loadingController);
}

function navigateToLogin() {
    SerializationUtil.deleteStoredSession();
    SerializationUtil.navigateToLogin();
}

async function main() {
    renderLoadingView();

    let res = await SerializationUtil.getAndCheckStoredSession();
    if (isHopperError(res)) {
        if (res == ERROR_UNAUTHENTICATED) {
            navigateToLogin();
            return;
        } else {
            renderError("No Permission for this instance");
            return;
        }
    }

    let api: IHopperApi = res[0];
    let user: User = res[1];

    let notifications = new NotificationSet();

    let loadingController = new LoadingController(api, notifications);
    if (api instanceof DummyHopperApi) {
        // @ts-ignore
        document._hopperApi = api; // For Testing API access
        // @ts-ignore
        document._loadingController = loadingController;
        let _user = user;
        let _notifications = notifications;
        let _lC = loadingController;
        // @ts-ignore
        document._updateHopperUi = () => {

            updateView(_user, _notifications, _lC);
        }
    } else {
        try {
            if (api instanceof HopperApi) {
                await WebSocketAdapter.openWebSocket(loadingController, api as HopperApi)
            }
        } catch (e) {
            console.log("Could not connect WebSocket");
            return;
        }
    }
    await loadingController.loadApps();

    updateView(user, notifications, loadingController);
}

main();


