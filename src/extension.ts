'use strict';

import { commands, ExtensionContext, window, workspace } from 'vscode';
import { exec } from 'child_process';
import { dirname } from 'path';

export function activate(context: ExtensionContext) {

    let gitTools = new GitTools();

    // Commands
    let gitK = commands.registerCommand('extension.gitK', () => {
        gitTools.gitK();
    });
    let gitKCurrentFile = commands.registerCommand('extension.gitKCurrentFile', () => {
        gitTools.gitKCurrentFile();
    });
    let gitGui = commands.registerCommand('extension.gitGui', () => {
        gitTools.gitGui();
    });
    let gitGuiBlame = commands.registerCommand('extension.gitGuiBlame', () => {
        gitTools.gitGuiBlame();
    });
    let gitCurrentCheckout = commands.registerCommand('extension.gitCurrentCheckout', () => {
        gitTools.gitCurrentCheckout();
    });

    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(gitK);
    context.subscriptions.push(gitKCurrentFile);
    context.subscriptions.push(gitGui);
    context.subscriptions.push(gitGuiBlame);
    context.subscriptions.push(gitCurrentCheckout);
}

export function deactivate() {
}

class GitTools {

    private _gitkArgs: string;

    constructor() {
        this._gitkArgs = workspace.getConfiguration('gitTools').get('gitkArgs', ' --all');
    }

    /**
     * gitK
     *
     * open gitk for active project
     */
    public gitK() {
        this.checkIsInsideGitWorkTree(() => {
            this.execShellCommand('gitk' + this._gitkArgs);
        });
    }

    /**
     * gitKCurrentFile
     *
     * open gitk for active file
     */
    public gitKCurrentFile() {
        if (window.activeTextEditor) {
            this.checkIsInsideGitWorkTree(() => {
                this.execShellCommand('gitk' + this._gitkArgs + ' ' + this.file());
            });
        } else {
            this.gitK();
        }
    }

    /**
     * gitGui
     *
     * open Git Gui for project
     */
    public gitGui() {
        this.checkIsInsideGitWorkTree(() => {
            this.execShellCommand('git gui');
        });
    }

    /**
     * gitGuiBlame
     *
     * open Git Gui blame of active file
     */
    public gitGuiBlame() {
        if (window.activeTextEditor) {
            this.checkIsInsideGitWorkTree(() => {
                this.execShellCommand('git gui blame --line=' + this.line() + ' "' + this.file() + '"');
            });
        } else {
            window.showInformationMessage("Open file.");
        }
    }

    /**
     * gitCurrentCheckout
     *
     * checkout current file
     */
    public gitCurrentCheckout() {
        if (window.activeTextEditor) {
            this.checkIsInsideGitWorkTree(() => {
                this.execShellCommand('git checkout "' + this.file() + '"');
            });
        } else {
            window.showInformationMessage("Open file.");
        }
    }

    /**
     * checkIsInsideGitWorkTree
     *
     * Checks is inside git repository work tree
     *
     * @param method function to run if check is positive
     */
    private checkIsInsideGitWorkTree(method: Function) {
        if (this.dir()) {
            exec(this.moveToProjectCommand() + 'git rev-parse --is-inside-work-tree', (err, stdout, stderr) => {
                if (err) {
                    window.showInformationMessage('Not a git repository!');
                } else {
                    method();
                }
            });
        } else {
            window.showWarningMessage('Not a git repository!');
        }
    }

    /**
     * moveToProjectCommand
     *
     * @returns prefix for execShellCommand
     */
    private moveToProjectCommand() {
        const move_cmd = (process.platform == 'win32') ? 'pushd ' : 'cd ';
        return move_cmd + this.dir() + ' && ';
    }

    /**
     * execShellCommand
     *
     * @param command to run in shell
     */
    private execShellCommand(command: string) {
        exec(this.moveToProjectCommand() + command, (err, stdout, stderr) => {
            if (err) console.log('error: ' + err);
        });
    }

    /**
     * file
     *
     * @returns active file or undefined
    */
    private file() {
        if (window.activeTextEditor) {
            return window.activeTextEditor.document.uri.fsPath;
        }
        return undefined;
    }

    /**
     * dir
     *
     * @returns dir of active file or workspace root
     */
    private dir() {
        const file = this.file();

        if (file) {
            return dirname(file);
        } else {
            return workspace.rootPath;
        }
    }

    /**
     * line
     *
     * @returns active line or undefined
    */
    private line() {
        if (window.activeTextEditor) {
            return window.activeTextEditor.selection.active.line + 1;
        }
        return undefined;
    }
}