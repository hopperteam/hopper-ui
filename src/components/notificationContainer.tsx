import * as React from 'react';
import {App, Notification, Subscription} from "../types";
import {ChangeEvent} from "react";
import {DefaultNotificationView} from "./notificationViews";
import "style/notification.scss";
import { NotificationSet } from 'notificationSet';
import { LoadingController, SubscriptionManager } from 'loadingController';

type NotificationContainerProps = {
    loadingController: LoadingController
}

type NotificationContainerState = {
    currentlyLoading: boolean,
    notificationSet: NotificationSet
}

type NotificationListProps = {
    doneNotificationsVisible: boolean,
    notifications: NotificationSet,
    subscriptionManager: SubscriptionManager,
    showLoadingElement: boolean,
    toggleDoneFunction: (not: Notification) => void,
    deleteFunction: (not: Notification) => void
}

type NotificationFilterChooserProps = {
    includeDone: boolean,
    currentSubscription: string | undefined,
    subscriptionManager: SubscriptionManager,
    onUpdate: (includeDone: boolean, currentApp: string | undefined) => void
}


export type NotificationViewProps = {
    notification: Notification,
    subscription: Subscription,
    toggleDoneFunction: (not: Notification) => void,
    deleteFunction: (not: Notification) => void,
    doneNotificationsVisible: boolean
}

const notificationTypes: { [index: string] : React.ClassType<NotificationViewProps, any, any>} = {
    "default": DefaultNotificationView
};


export class NotificationContainer extends React.Component<NotificationContainerProps, NotificationContainerState> {
    constructor(props: Readonly<NotificationContainerProps>) {
        super(props);
        this.state = { 
                        notificationSet: this.props.loadingController.getNotificationSet(false, undefined), 
                        currentlyLoading: false, 
                     }
    }

    private async checkScrollState(el: HTMLElement): Promise<void> {
        if (!this.state.notificationSet.hasMore) return;
        let invisibleSpaceBottom = el.scrollHeight - el.offsetHeight - el.scrollTop;

        if (invisibleSpaceBottom < 1000) {
            if (this.state.currentlyLoading) return;
            this.setState({currentlyLoading: true});
            await this.state.notificationSet.loadMore();
            this.setState({currentlyLoading: false});
        }
        return this.checkScrollState(el);
    }

    private async callCheckScrollState() {
        let x = document.getElementById("notificationContainer");
        if (x == null) return;
        return this.checkScrollState(x);
    }

    private resizeListener = this.callCheckScrollState.bind(this);

    async componentDidMount() {
        //this.props.loadingController.onUpdateListener = () => {
        //    this.forceUpdate();
        //};
        window.addEventListener("resize", this.resizeListener);
        await this.callCheckScrollState();
    }

    componentWillUnmount(): void {
        //this.props.loadingController.onUpdateListener = () => { };
        window.removeEventListener("resize", this.resizeListener);
    }

    private onFilterUpdate(includeDone: boolean, currentApp: string | undefined) {
        this.setState({
            notificationSet: this.props.loadingController.getNotificationSet(includeDone, currentApp),
            currentlyLoading: false,
        });
    }

    private async toggleDone(not: Notification) {
        if (not.isDone) {
            await this.state.notificationSet.markAsUndone(not);
        } else {
            await this.state.notificationSet.markAsDone(not);
        }
    }

    private async deleteNotification(not: Notification) {
        await this.state.notificationSet.deleteNotification(not);
    }

    render(): React.ReactNode {
        return <div id="notificationContainer" 
                    onScroll={ e => this.checkScrollState(e.target as HTMLElement) }>
            <NotificationFilterChooser  subscriptionManager={this.props.loadingController.subscriptionManager}
                                        currentSubscription={this.state.notificationSet.category.subscription} 
                                        includeDone={this.state.notificationSet.category.includeDone} 
                                        onUpdate={this.onFilterUpdate.bind(this)} /> 
            <NotificationList notifications={this.state.notificationSet}
                              subscriptionManager={this.props.loadingController.subscriptionManager}
                              doneNotificationsVisible={this.state.notificationSet.category.includeDone}
                              showLoadingElement={this.state.notificationSet.hasMore}
                              toggleDoneFunction={this.toggleDone.bind(this)}
                              deleteFunction={this.deleteNotification.bind(this)} />
        </div>
    }

    async componentDidUpdate(prevProps: Readonly<NotificationContainerProps>, prevState: Readonly<NotificationContainerState>, snapshot?: any) {
        await this.callCheckScrollState();
    }
}

export class NotificationFilterChooser extends React.Component<NotificationFilterChooserProps> {

    private onIncludeDoneChange(evt: ChangeEvent<HTMLInputElement>) {
        this.props.onUpdate(evt.target.checked, this.props.currentSubscription);
    }

    private onSubscriptionClick(subscriptionId: string) {
        if (subscriptionId == this.props.currentSubscription) {
            this.props.onUpdate(this.props.includeDone, undefined);
        } else {
            this.props.onUpdate(this.props.includeDone, subscriptionId);
        }
    }

    render(): React.ReactNode {
        return <div id="notificationFilterChooser" >
            <input type="checkbox" onChange={this.onIncludeDoneChange.bind(this)} checked={this.props.includeDone} id="includeDoneSelector"/>
            <label id="includeDoneSelectorLabel" htmlFor="includeDoneSelector" />
            <div id="selectorSeparator" />
            <div id="appLabels">
            {
                this.props.subscriptionManager
                    .map(subscription => {
                        return <img src={subscription.app.imageUrl}
                                    alt={subscription.app.name}
                                    onClick={() => this.onSubscriptionClick(subscription.id)}
                                    id={"app-" + subscription.id}
                                    key={subscription.id}
                                    onError={evt => { evt.currentTarget.onerror = () => {}; evt.currentTarget.src = require('img/unknown_app.svg')} }
                                    className={"appFilter " + (this.props.currentSubscription !== undefined && this.props.currentSubscription !== subscription.id ? "appFilterNotSelected" : "") } />;
                    })
            }
            </div>
        </div>
    }
}

export class NotificationList extends React.Component<NotificationListProps> {
    render(): React.ReactNode {
        return <div id="notificationList" >
            {this.props.notifications.map(value => {
                let x = notificationTypes[value.type];
                if (x == undefined) {
                    console.error("Could not render notification " + value.id + "! Invalid type " + value.type);
                    return;
                }

                return React.createElement(x, {
                    key: value.id, 
                    doneNotificationsVisible: this.props.doneNotificationsVisible, 
                    notification: value, 
                    subscription: this.props.subscriptionManager.getSubscriptionOrDefault(value.subscription), 
                    toggleDoneFunction: this.props.toggleDoneFunction, 
                    deleteFunction: this.props.deleteFunction
                }, null);
            })}
            { this.props.showLoadingElement ? <LoadingNotificationView /> : "" }
        </div>
    }
}

export class LoadingNotificationView extends React.Component {
    render(): React.ReactNode {
        return <div className="notification">
            ...
        </div>
    }
}

