import {App, Notification, SubscribeRequest, Subscription, User} from "types";
import ApiBase from "api/restfulApi";

export type HopperError = number;
export const ERROR_UNAUTHENTICATED = 1;
export const ERROR_NO_PERMISSION = 2;

export function isHopperError(v: any): v is HopperError {
    return v === ERROR_UNAUTHENTICATED || v === ERROR_NO_PERMISSION;
}

export interface IHopperApi {
    getCurrentUser(): Promise<User|HopperError>

    getSubscriptions(): Promise<Subscription[]>
    getNotifications(includeDone: boolean, subscription: string|undefined, offset: number, limit: number): Promise<Notification[]>
    getSubscribeRequest(data: string, appId: string): Promise<SubscribeRequest|undefined>
    postSubscribeRequest(data: string, appId: string): Promise<string|undefined>
    markNotificationAsDone(notificationId: string): Promise<boolean>
    markNotificationAsUndone(notificationId: string): Promise<boolean>
    getApp(appId: string): Promise<App|undefined>
    deleteNotification(notificationId: string): Promise<boolean>
}

export class HopperApi extends ApiBase implements IHopperApi {

    static instanceLoginUrl: string = "";
    static instanceLogoutUrl: string = "";
    static instanceApiRot: string = "";

    static loadInfo() {
        return new Promise((resolve: any) => {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', '/instance.json', true);
            xhr.onload = () => {
                try {
                    let info = JSON.parse(xhr.responseText);
                    this.instanceLoginUrl = info.loginUrl;
                    this.instanceLogoutUrl = info.logoutUrl;
                    this.instanceApiRot = info.apiRoot;
                    resolve();
                } catch (e) {
                    resolve();
                }
            };
            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xhr.send();
        });
    }

    static createApi(token: string): HopperApi {
        return new HopperApi(this.instanceApiRot, token);
    }

    constructor(apiPath: string, bearerToken: string) {
        super(apiPath, bearerToken);
    }

    async getCurrentUser(): Promise<User|HopperError> {
        let resp = await this.get("/user");
        if (resp.status == 403) return ERROR_NO_PERMISSION;
        if (resp.status == 401) return ERROR_UNAUTHENTICATED;
        return resp.result;
    }

    async getSubscriptions(): Promise<Subscription[]> {
        let resp = await this.get("/subscriptions");
        if (resp.status != 200) return [];
        return resp.result;
    }

    async getNotifications(includeDone: boolean, subscription: string | undefined, offset: number, limit: number): Promise<Notification[]> {
        let resp = await this.get("/notifications", {
            includeDone: includeDone,
            subscription: subscription,
            skip: offset,
            limit: limit
        });
        if (resp.status != 200) return [];
        return resp.result;
    }

    async getSubscribeRequest(content: string, appId: string): Promise<SubscribeRequest|undefined> {
        let resp = await this.get("/subscribeRequest", {
            content: content,
            id: appId
        });
        if (resp.status != 200) return undefined;
        return resp.result.subscribeRequest;
    }

    async postSubscribeRequest(content: string, appId: string): Promise<string|undefined> {
        let resp = await this.post("/subscribeRequest", {
            content: content,
            id: appId
        });
        if (resp.status != 200) return undefined;
        return resp.result.subscriptionId;
    }

    async markNotificationAsDone(notificationId: string): Promise<boolean> {
        let resp = await this.post("/notifications/done", {
            id: notificationId
        });
        return resp.status == 200;
    }

    async markNotificationAsUndone(notificationId: string): Promise<boolean> {
        let resp = await this.post("/notifications/undone", {
            id: notificationId
        });
        return resp.status == 200;
    }

    async getApp(appId: string): Promise<App|undefined> {
        let resp = await this.get("/apps", {
            id: appId
        });
        if (resp.status != 200) return undefined;
        return resp.result;
    }

    async deleteNotification(notificationId: string): Promise<boolean> {
        let resp = await this.delete("/notifications", {
            id: notificationId
        });
        return resp.status == 200;
    }
}
