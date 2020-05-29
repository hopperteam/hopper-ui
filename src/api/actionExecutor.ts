import {Action} from "types";

export class ActionExecutor {
    public static executeAction(a: Action, text: string = "") {
        switch (a.type) {
            case "text":
                let textXhr = new XMLHttpRequest();
                textXhr.open("POST", a.url, true);
                textXhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                textXhr.send(JSON.stringify({
                    text: text
                }));
                break;
            case "submit":
                let submitXhr = new XMLHttpRequest();
                submitXhr.open("POST", a.url, true);
                submitXhr.send();
                break;
            case "redirect":
                window.open(a.url,'_blank');
                break;
        }
    }
}
