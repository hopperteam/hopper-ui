import * as React from "react";
import * as ReactDOM from 'react-dom';
import {User} from "types";
import MainView from "components/mainView";
import LoadingView from "components/loadingView";
import DummyHopperApi from "api/dummyHopperApi";
import SerializationUtil from "./serializationUtil";
import {IHopperApi, HopperApi, isHopperError, ERROR_UNAUTHENTICATED} from "./api/hopperApi";

import "style/app.scss";
import {WebSocketAdapter} from "./api/webSocketAdapter";
import { LoadingController } from "loadingController";

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

function updateView(user: User, loadingController: LoadingController) {
    ReactDOM.render(
        <MainView onClickLogout={navigateToLogin} user={user} 
                  loadingController={loadingController} />,
        document.getElementById("root")
    );
    setTimeout(() => {
        updateView(user, loadingController);
    });
}

function updateLoop(user: User, loadingController: LoadingController) {
    setTimeout(() => updateLoop(user, loadingController), UPDATE_INTERVAL);
    updateView(user, loadingController);
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

    let loadingController = new LoadingController(api);
    if (api instanceof DummyHopperApi) {
        // @ts-ignore
        document._hopperApi = api; // For Testing API access
        // @ts-ignore
        document._loadingController = loadingController;
        let _user = user;
        let _lC = loadingController;
        // @ts-ignore
        document._updateHopperUi = () => {
            loadingController.currentNotificationSet.clearCache();
            updateView(_user, _lC);
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
    await loadingController.init();

    updateView(user, loadingController);
}

main();


