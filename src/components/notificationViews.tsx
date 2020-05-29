import * as React from "react";
import {NotificationViewProps} from "./notificationContainer";
import {Action} from "types";
import {ActionExecutor} from "../api/actionExecutor";

function getTimeText(date: number): string {
    let diff = Date.now() - date;
    let future = diff < 0;
    diff = Math.abs(diff);

    if (diff < 60000) {
        return "now";
    }

    diff = Math.floor(diff / 60000);
    if (diff < 60) {
        return (future) ? "In " + diff + " min" : diff + " min ago";
    }

    let d = new Date(date);
    let dNow = new Date();

    if (d.toDateString() == dNow.toDateString()) {
        return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
    } else {
        return d.toLocaleString([], {year: "2-digit", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"});
    }
}

type NotificationViewState = {
    dragX: number
    dragReached: number
    activeAction: Action | undefined
    textInput: string
}

export class DefaultNotificationView extends React.Component<NotificationViewProps, NotificationViewState> {
    private touchXStart: number = -1;
    private touchDragXStart: number = 0;
    private currentAnimation: number|undefined;
    private threshold: number = 0;

    constructor(props: NotificationViewProps) {
        super(props);
        this.state = {
            dragX: 0,
            dragReached: 0,
            activeAction: undefined,
            textInput: ""
        }
    }

    cancelCurrentAnimation() {
        if (this.currentAnimation != undefined) {
            clearInterval(this.currentAnimation);
            this.currentAnimation = undefined;
        }
    }

    animateToDragX(dragTarget: number, slowness: number = 30, after: () => void = () => {}) {
        this.cancelCurrentAnimation();
        if (dragTarget == this.state.dragX) {
            after();
            return;
        }
        let frames = Math.round(slowness * (Math.abs(dragTarget - this.state.dragX) / this.threshold));
        let counter = 0;
        let perFrame = (dragTarget - this.state.dragX) / frames;
        this.currentAnimation = setInterval(() => {
            counter++;
            this.updateDragState(this.state.dragX + perFrame);
            if (counter == frames) {
                clearInterval(this.currentAnimation);
                after();
            }
        });
    }

    updateDragState(dragX: number) {
        this.setState({
            dragX: dragX,
            dragReached: Math.min(1, Math.abs(dragX) / this.threshold)
        });
    }

    touchStart(evt: React.TouchEvent<HTMLDivElement>) {
        this.threshold = evt.currentTarget.clientHeight;
        this.cancelCurrentAnimation();
        if (evt.targetTouches.length >= 1) {
            let touch = evt.targetTouches.item(0);
            this.touchXStart = touch.clientX;
            this.touchDragXStart = this.state.dragX;
        }
    }

    touchMove(evt: React.TouchEvent<HTMLDivElement>) {
        let dragX = evt.targetTouches.item(0).clientX - this.touchXStart + this.touchDragXStart;
        this.updateDragState(dragX);
    }

    touchEnd(evt: React.TouchEvent<HTMLDivElement>) {
        this.threshold = evt.currentTarget.clientHeight;
        if (this.state.dragX >= this.threshold) {
            this.toggleDone();
        } else if (this.state.dragX >= this.threshold / 2) {
            this.animateToDragX(this.threshold);
        } else if (this.state.dragX <= -this.threshold) {
            this.delete();
        } else if (this.state.dragX <= -this.threshold / 2) {
            this.animateToDragX(-this.threshold);
        } else {
            this.animateToDragX(0);
        }
    }

    delete() {
        this.threshold = document.getElementById("not-" + this.props.notification.id)?.clientHeight || 50;
        this.animateToDragX(-document.body.clientWidth, 4, () => {
            this.props.deleteFunction(this.props.notification);
        });
    }

    toggleDone() {
        this.threshold = document.getElementById("not-" + this.props.notification.id)?.clientHeight || 50;
        if (this.props.doneNotificationsVisible) {
            this.animateToDragX(0, 10, () => {
                this.props.toggleDoneFunction(this.props.notification);
            });
        } else {
            this.animateToDragX(document.body.clientWidth, 4, () => {
                this.props.toggleDoneFunction(this.props.notification);
                this.updateDragState(0);
            });
        }
    }

    async clickAction(a: Action) {
        console.log(a)
        if (a.type === "text") {
            this.setState({
                activeAction: a
            });
        } else {
            await this.executeAction(a);
        }
    }

    textActionCancel() {
        this.setState({
            activeAction: undefined
        });
    }

    async executeAction(a: Action, text: string = "") {
        await ActionExecutor.executeAction(a, text);
        if (a.markAsDone && !this.props.notification.isDone) {
            this.toggleDone();
        }
    }

    async executeTextAction() {
        await this.executeAction(this.state.activeAction!, this.state.textInput);
        this.textActionCancel();
    }

    render(): React.ReactNode {
        return <div id={"not-" + this.props.notification.id}
                    className={"notification " + (this.state.dragX >= 0 ? ( !this.props.notification.isDone ? "markingDone" : "markingUndone") : "deleting") + ( !this.props.notification.isDone ? " undone" : " done")}>
            <div className="notificationBackground" style={{opacity: this.state.dragReached}}/>
            <div className="notificationElement"
                 onTouchStart={this.touchStart.bind(this)}
                 onTouchMove={this.touchMove.bind(this)}
                 onTouchEnd={this.touchEnd.bind(this)}
                style={{transform: `translateX(${this.state.dragX}px)`}}>
                <div className="notificationLeftBox" >
                    <div className="notificationMeta">
                        <span className="notificationSender">{this.props.subscription.app.name}</span>
                        <div className="notificationSenderSeparator" />
                        <span className="notificationTime">{getTimeText(this.props.notification.timestamp)}</span>
                    </div>
                    <div className="notificationContent">
                        <img className="notificationImage" alt="notificationImage" src={
                                this.props.notification.imageUrl != undefined ? this.props.notification.imageUrl : this.props.subscription.app.imageUrl}
                            onError={evt => { evt.currentTarget.onerror = () => {}; evt.currentTarget.src = require('img/unknown_app.svg')} }
                        />
                        <div className="notificationTextContent">
                            <p className="notificationTitle">{this.props.notification.heading}</p>
                            <div className="notificationBody">
                                {(this.props.notification.content as string).split("\n")
                                    .map((line, key) => {
                                        return <span key={key}>
                                                    {line}
                                                    <br />
                                               </span>
                                    })}
                            </div>
                        </div>
                    </div>
                    {
                        (this.state.activeAction === undefined) ?
                            <div className="notificationActions">
                                {(this.props.notification.actions).map(action => {
                                    return <div className="notificationAction" onClick={() => this.clickAction(action)} key={this.props.notification.id + "-" + action.text}>{action.text}</div>
                                })}
                            </div>
                            :
                            <div className="notificationTextAction">
                                <input className="notificationTextInput" type="text" value={this.state.textInput} onChange={(event) => this.setState({ textInput: event.target.value }) } />
                                <div className="notificationTextButton notificationTextAbort" onClick={this.textActionCancel.bind(this)} />
                                <div className="notificationTextButton notificationTextSend" onClick={this.executeTextAction.bind(this)}  />
                            </div>
                    }
                </div>
                <div className="notificationRightBox">
                    <div className="notificationButtons">
                        <div className="deleteButton" onClick={ this.delete.bind(this) } />
                        <div className="buttonSeparator" />
                        <div className={"doneToggleButton " + (!this.props.notification.isDone ? "markDoneButton" : "markUndoneButton") } onClick={ this.toggleDone.bind(this) } />
                    </div>
                </div>
            </div>
        </div>
    }
}
