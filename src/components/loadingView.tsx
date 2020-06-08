import * as React from 'react';

import "../style/loading.scss";
const logoImg = require("../img/logo_small.svg");

export default class LoadingView extends React.Component {

    render(): React.ReactNode {
        return <div id="loadingView">
            <div id="loadingCenter">
                <img src={logoImg} alt="Loading" id="loadingLogo"/>
            </div>
        </div>;
    }
}
