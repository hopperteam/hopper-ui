import Cookies from 'js-cookie'
import DummyHopperApi from "./api/dummyHopperApi";
import {IHopperApi, HopperApi, HopperError, ERROR_UNAUTHENTICATED, isHopperError} from "./api/hopperApi";
import {User} from "./types";
import {HopperUtil} from "./hopperUtil";

export default class SerializationUtil {
    public static hasStoredSession() {
        return Cookies.get("HOPPER_SESSION") != undefined || !!HopperUtil.getUrlParameter("dummy");
    }

    public static async getStoredSession(): Promise<IHopperApi> {
        let bearerToken = Cookies.get("HOPPER_SESSION");
        if (!!HopperUtil.getUrlParameter("dummy") || bearerToken === undefined) {
            return new DummyHopperApi();
        }

        return HopperApi.createApi(bearerToken);
    }

    public static deleteStoredSession() {
        Cookies.remove("HOPPER_SESSION");
    }

    public static useDummyApi(): boolean {
        return !!HopperUtil.getUrlParameter("dummy");
    }

    public static async getAndCheckStoredSession(): Promise<[IHopperApi, User] | HopperError> {
        if (!this.useDummyApi()) {
            await HopperApi.loadInfo();
        }

        if (SerializationUtil.hasStoredSession()) {
            let api = await SerializationUtil.getStoredSession();
            let result = await api.getCurrentUser();
            if (isHopperError(result)) {
                return result;
            }
            return [api, result as User];
        }

        return ERROR_UNAUTHENTICATED;
    }

    public static navigateToLogin() {
        document.location.assign(HopperApi.instanceLoginUrl + "?target=" + encodeURIComponent(window.location.href));
    }

    public static navigateToLogout() {
        document.location.assign(HopperApi.instanceLogoutUrl + "?target=" + encodeURIComponent(window.location.href));
    }
}
