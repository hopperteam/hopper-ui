import * as React from "react";
import * as ReactDOM from 'react-dom';
import {User} from "types";
import LoginView from "components/loginView";
import LoadingView from "components/loadingView"
import DummyHopperApi from "api/dummyHopperApi";
import SerializationUtil from "serializationUtil";
import {HopperApi, IHopperApi} from "./api/hopperApi";
import {HopperUtil} from "./hopperUtil";
import LoginSignUpView from "./components/loginSignUpView";

function renderLoadingView() {
    ReactDOM.render(
        <LoadingView />,
        document.getElementById("root")
    );
}


function render(api: IHopperApi) {
    ReactDOM.render(
        <LoginSignUpView onLoggedIn={() => loginComplete(api)} api={api}/>,
        document.getElementById("root")
    );
}

function loginComplete(api: IHopperApi) {
    SerializationUtil.storeSession(api);
    console.log("stored session");

    let redirect = HopperUtil.getUrlParameter("redirect");
    if (redirect && typeof(redirect) === 'string') {
        document.location.assign(redirect);
        return;
    }
    document.location.assign("/app");
}

async function main() {
    let useDummyApi = !!HopperUtil.getUrlParameter("dummy");
    let api: IHopperApi = (useDummyApi) ? new DummyHopperApi(): await HopperApi.createApi();
    if (useDummyApi) {
        console.log("Using dummy api!");
    }

    renderLoadingView();
    if (await SerializationUtil.getAndCheckStoredSession() != undefined) {
        loginComplete(api);
        return;
    }


    render(api);
}

main();

