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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "stack-runner" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.runStackRunner', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Running stack runner now');
		const rootPath = vscode.workspace.rootPath;
		const bin = vscode.workspace.getConfiguration('stackrunner').get('serverBinary');
		runStackRunner(`${bin}`, rootPath || '')
			.then(bes => {
				if (bes.length === 0) {
					vscode.window.showInformationMessage('Stack Runner was able to build your project successfully!');
				} else {
					bes.forEach(be => {
						be.details = be.details.map(d => {
							return d.replace(/^.*\[warn\]\s*/, '');
						});
						vscode.window.showErrorMessage(`Build Error: ${be.file}`);
					});
				}
			})
			.catch(err => {
				vscode.window.showErrorMessage(err.toString());
			});

	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
