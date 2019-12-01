// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';

export interface IBuildError {
	file: string;
	line: number;
	column: number;
	extras: string;
	details: string[];
}

function runStackRunner(cmd: string, rootPath: string): Promise<IBuildError[]> {
	return new Promise((res, rej) => {
		cmd = cmd || `/home/abhi/Projects/go/bin/stackrunner_server`;
		rootPath = rootPath || '/home/abhi/Projects/stack/HSRest';
		const sp = cp.spawn(cmd, [rootPath]);
		sp.stdout.on('data', d => {
			const bes = <IBuildError[]>(JSON.parse(d));
			res(bes);
		});

		// sp.on('message', m => {
		// 	console.log(m);
		// });

		sp.on('error', err => {
			rej(err);
		});

		// sp.on('disconnect', () => {
		// 	console.log('disconnected!!');
		// });

		// sp.on('exit', c => {
		// 	console.log(c);
		// });

		// sp.on('close', (c, s) => {
		// 	console.log(c, s);
		// });

	});
}

let dgnstsColl = vscode.languages.createDiagnosticCollection('stackrunner');
let textDocument: vscode.TextDocument;

export function runStackRunnerWith(textDocument: vscode.TextDocument, context: vscode.ExtensionContext) {
	// Display a message box to the user
	vscode.window.showInformationMessage('Running stack runner now');
	const rootPath = vscode.workspace.getWorkspaceFolder(textDocument.uri);
	const bin = vscode.workspace.getConfiguration('stackrunner').get('serverBinary');
	runStackRunner(`${bin}`, rootPath ? rootPath.uri.fsPath : '')
		.then(bes => {
			if (bes.length === 0) {
				vscode.window.showInformationMessage('Stack Runner was able to build your project successfully!');
				dgnstsColl.clear();
			} else {
				if (dgnstsColl) {
					dgnstsColl.clear();
				}
				const dgnsts: vscode.Diagnostic[] = [];
				bes.forEach(be => {
					be.details = be.details.map(d => {
						return d.replace(/^.*\[warn\]\s*/, '');
					});
					if (!!be.extras && be.extras.trim().length > 0) {
						be.details.unshift(be.extras);
					}
					const pos1 = new vscode.Position(be.line - 1, be.column);
					// const pos2 = new vscode.Position(be.line, 0);
					const rng = new vscode.Range(pos1, pos1);
					const dgnst = new vscode.Diagnostic(rng, be.details.join('\n'), vscode.DiagnosticSeverity.Error);
					dgnsts.push(dgnst);
				});
				dgnstsColl.set(textDocument.uri, dgnsts);
				vscode.window.showErrorMessage(`Found ${bes.length} build errors!`);
				context.subscriptions.push(dgnstsColl);
			}
		})
		.catch(err => {
			vscode.window.showErrorMessage(err.toString());
		});
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "stack-runner" is now active!');

	vscode.workspace.onDidSaveTextDocument(td => {
		runStackRunnerWith(td, context);
	});

	vscode.workspace.onDidChangeTextDocument(td => {
		textDocument = td.document;
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }
