import * as React from 'react';
import {User} from 'types';
import {NotificationContainer} from 'components/notificationContainer'
import TopBarView from 'components/topBarView'
import TopMessage from "components/topMessage";
import {DesktopNotificationManager} from "desktopNotificationManager";
import { LoadingController } from 'loadingController';

type MainViewProps = {
    user: User,
    loadingController: LoadingController,
    onClickLogout: () => void
}

type MainViewState = {
    dismissedNotificationMessage: boolean
}

export default class MainView extends React.Component<MainViewProps, MainViewState> {

    constructor(props: MainViewProps) {
        super(props);
        this.state = {
            dismissedNotificationMessage: false
        }
    }

    async requestNotificationsPermission() {
        await DesktopNotificationManager.requestPermissions();
        this.forceUpdate();
    }

    render(): React.ReactNode {
        return <div id="mainView">
            { (!this.state.dismissedNotificationMessage && DesktopNotificationManager.canRequestPermission())
                && <TopMessage text="Do you want to receive notifications by hopper?"
                               buttonText="Yes!"
                               onButtonClick={this.requestNotificationsPermission.bind(this)}
                               onClose={ () => this.setState({ dismissedNotificationMessage: true })} />
            }
            <TopBarView onClickLogout={this.props.onClickLogout} 
                        user={this.props.user} />
            <NotificationContainer loadingController={this.props.loadingController} />
        </div>;
    }
}
