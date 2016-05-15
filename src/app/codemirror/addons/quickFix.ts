/**
 * The quick fix (bulb) plugin
 */
import * as CodeMirror from "codemirror";
import * as utils from "../../../common/utils";
import {server} from "../../../socket/socketClient";
import * as types from "../../../common/types";
import * as state from "../../state/state";
import cmUtils = require("../cmUtils");


const gutterId = "CodeMirror-quick-fix";
const gutterItemClassName = "CodeMirror-quick-fix-bulb";

require('./quickFix.css');
export function setupOptions(options: any) {
    options.gutters.unshift(gutterId);
}

export function setupCM(cm: CodeMirror.EditorFromTextArea): { dispose: () => void } {
    // if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = cm.filePath;

    function makeMarker() {
        var marker = document.createElement("div");
        marker.className = gutterItemClassName;
        marker.innerHTML = "💡";
        return marker;
    }
    /** Automatically clears any old marker */
    let _currentMarker: CodeMirror.LineHandle = null;
    function setMarker(line: number) {
        clearAnyMarker();
        const lineHandle = cm.setGutterMarker(line, gutterId, makeMarker());
        _currentMarker = lineHandle;
    }
    function clearAnyMarker() {
        if (_currentMarker){
            const newLine: number | null = (cm as any).getLineNumber(_currentMarker);
            if (newLine) {
                cm.setGutterMarker(newLine, gutterId, null);
            }
            _currentMarker = null;
        }
    }

    // The key quick fix get logic
    const refreshQuickFixes = () => {
        clearAnyMarker();

        // If !singleCursor return
        let singleCursor = cmUtils.isSingleCursor(cm);
        if (!singleCursor) {
            return;
        }
        // If not active project return
        if (!state.inActiveProjectFilePath(cm.filePath)) {
            return;
        }
        // query the server with quick fixes
        const cur = cm.getDoc().getCursor();
        const indentSize = cm.getOption('indentUnit');
        const position = cm.getDoc().indexFromPos(cur);
        server.getQuickFixes({
            indentSize,
            filePath: cm.filePath,
            position
        }).then(res=>{
            console.log(res);
            if (res.fixes.length) {
                setMarker(cur.line);
            }
            // TODO:
            // Render the quick fixes
        });
    };

    const refreshQuickFixesDebounced = utils.debounce(refreshQuickFixes, 2000);

    const handleFocus = () => {
        refreshQuickFixes();
    }

    cm.on('focus', handleFocus);
    // Add a few other things to call refresh with debouncing
    cm.on('change', refreshQuickFixesDebounced);
    cm.on('cursorActivity', refreshQuickFixesDebounced);
    return {
        dispose: () => {
            cm.off('focus', handleFocus);
            cm.off('change', refreshQuickFixesDebounced);
            cm.off('cursorActivity', refreshQuickFixesDebounced);
            clearAnyMarker();
        }
    }
}
