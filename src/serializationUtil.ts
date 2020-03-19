import Cookies from 'js-cookie'
import DummyHopperApi from "./api/dummyHopperApi";
import {IHopperApi, HopperApi} from "./api/hopperApi";
import {User} from "./types";

export default class SerializationUtil {
    public static hasStoredSession() {
        return Cookies.get("hopper_api") != undefined || Cookies.get("hopper_api") == "#DUMMY#"
    }

    public static getStoredSession(): IHopperApi {
        let apiBin = Cookies.get("hopper_api");
        if (apiBin == "#DUMMY#" || apiBin == undefined) {
            return new DummyHopperApi();
        }
        let api = JSON.parse(atob(apiBin));
        return new HopperApi(api.root, api.token);
    }

    public static storeSession(api: IHopperApi) {
        if (api instanceof HopperApi) {
            let hApi = api as HopperApi;
            Cookies.set("hopper_api", btoa(JSON.stringify({"root": hApi.apiRoot, "token": hApi.apiBearerToken})));
        } else {
            Cookies.set("hopper_api", "#DUMMY#");
        }
    }

    public static deleteStoredSession() {
        Cookies.remove("hopper_api");
    }

    public static async getAndCheckStoredSession(): Promise<[IHopperApi, User] | undefined> {
        if (SerializationUtil.hasStoredSession()) {
            let api = SerializationUtil.getStoredSession();
            let user = await api.getCurrentUser();
            if (user != undefined) {
                return [api, user];
            }
        }
    }
}
