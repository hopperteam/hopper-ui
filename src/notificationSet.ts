import {App, Notification, Subscription} from "types";
import { LoadingController, NotificationCategory} from "loadingController";
import { IHopperApi } from "api/hopperApi";

const LOAD_BATCH_SIZE = 10;

export class NotificationSet {
    private _api: IHopperApi;
    private _loadingController: LoadingController;
    private _category: NotificationCategory;  
    private _data: Notification[];
    private _hasMore: boolean;
    
    constructor(api: IHopperApi, loadingController: LoadingController, category: NotificationCategory) {
        this._api = api;
        this._loadingController = loadingController;
        this._category = category;
        this._data = [];
        this._hasMore = true;
    }

    public get hasMore() {
        return this._hasMore;
    }

    public get category() {
        return this._category;
    }

    public map(fnc: (x: Notification) => any): any[] {
        return this._data.map(fnc);
    }

    public clearCache() {
        this._data = [];
        this._hasMore = true;
    }

    public getLoaded(): number {
        return this._data.length;
    }

    public appendNotifications(nots: Notification[]) {
        this._data = this._data.concat(nots);
    }

    public async loadMore() {
        let nots = await this._api.getNotifications(
                this._category.includeDone, 
                this._category.subscription, 
                this._data.length, 
                this._data.length + LOAD_BATCH_SIZE
        );

        if (nots.length < LOAD_BATCH_SIZE) {
            this._hasMore = false;
        }

        this.appendNotifications(nots);
    }

    public async markAsUndone(not: Notification) {
        if (!await this._api.markNotificationAsUndone(not.id)) {
            // Error
            return;
        }
        let ind = this._data.indexOf(not)
        if (ind == -1) {
            return; 
        }
        this._data[ind].isDone = false;
    }

    public async markAsDone(not: Notification) {
        if (!await this._api.markNotificationAsDone(not.id)) {
            // Error
            return;
        }
        let ind = this._data.indexOf(not)
        if (ind === -1) return; 

        if (this._category.includeDone) {
            this._data[ind].isDone = true;
        } else {
            this._data.splice(ind, 1);
        }
    }

    public async deleteNotification(not: Notification) {
        if (!await this._api.deleteNotification(not.id)) {
            // Error
            return;
        }
        let ind = this._data.indexOf(not)
        if (ind === -1) return; 

        this._data.splice(ind);
    }

    private indexOfById(id: string) {
        for (let i = 0; i < this._data.length; ++i) {
            if (this._data[i].id === id) return i; 
        }
        return -1;
    }

    public async deleteNotificationById(notId: string) {
        let index = this.indexOfById(notId);
        if (index === -1) return;
        
        this._data.splice(index);
    }

    public async insertNotificationIfRelevant(not: Notification) {
        if (!this.isRelevant(not)) return;
        // Determine index
        let i = 0;
        for (; i < this._data.length && this._data[i].timestamp > not.timestamp; ++i) {  }
        
        this._data.splice(i, 0, not);
    }

    public async updateNotification(not: Notification) {
        this.deleteNotificationById(not.id);
        this.insertNotificationIfRelevant(not);
    }

    public isRelevant(not: Notification) {
        if (this._category.subscription !== undefined && this._category.subscription !== not.subscription) return false;
        if (!this._category.includeDone && not.isDone) return false;

        return true;
    }
}
