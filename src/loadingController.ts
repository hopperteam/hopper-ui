import {Notification, Subscription} from "types";
import {IHopperApi} from "api/hopperApi";
import { NotificationSet } from "notificationSet";

export type NotificationCategory = {
    includeDone: boolean,
    subscription: string | undefined
}

export class LoadingController {
    private api: IHopperApi;
    private _subscriptionManager: SubscriptionManager;
    private _currentNotificationSet: NotificationSet | undefined;

    constructor(api: IHopperApi) {
        this.api = api;
        this._subscriptionManager = new SubscriptionManager(api);
    }

    public get currentNotificationSet(): NotificationSet {
        return this._currentNotificationSet!;
    }

    public async init() {
        this._subscriptionManager.loadSubscriptions();
    }
 
    public getNotificationSet(includeDone: boolean, subscription: string | undefined): NotificationSet {
        let set = new NotificationSet(this.api, this, {includeDone: includeDone, subscription: subscription});
        this._currentNotificationSet = set;
        return set;
    }

    public get subscriptionManager(): SubscriptionManager {
        return this._subscriptionManager;
    }
    
}

const UNKNOWN_SUBSCRIPTION: Subscription = {
    id: "UNKNOWN",
    app: {
        id: "UNKNOWN",
        name: "Unknown App",
        imageUrl: require("img/unknown_app.svg"),
        isActive: false,
        isHidden: true,
        baseUrl: document.location.protocol + "//"  + document.location.host,
        manageUrl: document.location.protocol + "//"  + document.location.host
    }
}


export class SubscriptionManager {
    private _api: IHopperApi;
    private _data: { [index: string] : Subscription }

    constructor(api: IHopperApi) {
        this._api = api;
        this._data = {};
    }

    public async loadSubscriptions() {
        this._data = {};
        let subs = await this._api.getSubscriptions();
        subs.map(this.insertSubscription.bind(this));
    }

    public insertSubscription(s: Subscription) {
        this._data[s.id] = s;
    }

    public deleteSubscriptionById(subId: string) {
        if (subId in this._data)
            delete this._data[subId]
    }

    public updateSubscription(sub: Subscription) {
        this._data[sub.id] = sub;
    }

    public map(fnc: (x: Subscription) => any): any[] {
        return Object.values(this._data).map(fnc);
    }

    public getSubscriptionOrDefault(subId: string): Subscription {
       if (subId in this._data)
            return this._data[subId];
       return UNKNOWN_SUBSCRIPTION;
    }
}

