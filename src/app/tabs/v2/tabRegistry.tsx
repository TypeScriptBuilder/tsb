/**
 * Does the mapping between urls to different tabs
 * Anything about tabs that needs to change based on tab protocol should go here
 */
import * as utils from "../../../common/utils";
import * as tab from "./tab";
import * as ui from "../../ui";

/** Various tabs  */
import {Code} from "./codeTab";

type ComponentConstructor = { new (props: any): tab.Component };

interface TabConfig {
    advancedSearch: boolean;
    getTitle(url:string): string;
    component: ComponentConstructor;
}

let tabs: {[protocol:string]:TabConfig} = {
    file: {
        advancedSearch: true,
        getTitle: utils.getFileName,
        component: Code,
    }
}

export function getTabConfigs() {
    return Object.keys(tabs).map((protocol) => ({ protocol, config: tabs[protocol] }));
}

export function getComponentByUrl(url: string): ComponentConstructor {
    let {protocol} = utils.getFilePathAndProtocolFromUrl(url);
    let tab = tabs[protocol];
    if (tab) return tab.component;

    let error = 'Unknown protocol: ' + protocol;
    throw new Error(error);
}

export function getTabConfigByUrl(url: string): TabConfig {
    let {protocol} = utils.getFilePathAndProtocolFromUrl(url);
    let tab = tabs[protocol];
    if (tab) return tab;

    let error = 'Unknown protocol: ' + protocol;
    throw new Error(error);
}