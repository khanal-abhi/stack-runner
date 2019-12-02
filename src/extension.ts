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

function runStackRunner(cmd: string, rootPath: string): [Promise<IBuildError[]>, cp.ChildProcessWithoutNullStreams] {
	cmd = cmd || `/home/abhi/Projects/go/bin/stackrunner_server`;
	rootPath = rootPath || '/home/abhi/Projects/stack/HSRest';
	const sp = cp.spawn(cmd, [rootPath]);
	const prom = new Promise<IBuildError[]>((res, rej) => {
		sp.stdout.on('data', d => {
			const bes = <IBuildError[]>(JSON.parse(d));
			res(bes);
		});

		sp.on('error', err => {
			rej(err);
		});

	});

	return [prom, sp];
}

let dgnstsColl = vscode.languages.createDiagnosticCollection('stackrunner');
let textDocument: vscode.TextDocument;
let runOnSave = false;
let lastSp: cp.ChildProcessWithoutNullStreams;

const setupConfigurations = () => {
	const _runOnSave = vscode.workspace.getConfiguration('stackrunner').get('runonsave') as boolean;
	runOnSave = _runOnSave;
};

const conditionalStackRunner = (condition: boolean) => (td: vscode.TextDocument | undefined, ctx: vscode.ExtensionContext) => {
	if (!!td) {
		textDocument = td;
		if (condition) {
			runStackRunnerWith(td, ctx);
		}
	}
};

const prepareRange = (be: IBuildError) => {
	const sl = Math.max(0, be.line - 1);
	const pos1 = new vscode.Position(sl, be.column);
	let rng: vscode.Range;
	if (be.file && be.file.indexOf('.hs') === -1) {
		rng = new vscode.Range(pos1, new vscode.Position(Number.MAX_SAFE_INTEGER, 0));
	} else {
		rng = new vscode.Range(pos1, pos1);
	}
	return rng;
};

const prepareDiagnosticsMap = (bes: IBuildError[]) => {
	const dgnstsMap = new Map<string, vscode.Diagnostic[]>();
	bes.forEach(be => {
		be.details = be.details.map(d => {
			return d.replace(/^.*\[warn\]\s*/, '');
		});
		if (!!be.extras && be.extras.trim().length > 0) {
			be.details.unshift(be.extras);
		}
		const rng = prepareRange(be);
		const dgnst = new vscode.Diagnostic(rng, be.details.join('\n'), vscode.DiagnosticSeverity.Error);
		if (!dgnstsMap.has(be.file)) {
			dgnstsMap.set(be.file, []);
		}

		const dgnsts = dgnstsMap.get(be.file);
		if (!!dgnsts) {
			dgnsts.push(dgnst);
		}
	});
	return dgnstsMap;
};

const handlePromise = (prom: Promise<IBuildError[]>, context: vscode.ExtensionContext) => {
	return new Promise<void>((res, rej) => {
		if (prom) {
			prom.then(bes => {
				if (bes.length === 0) {
					vscode.window.showInformationMessage('Stack Runner was able to build your project successfully!');
				} else {
					const dgnstsMap = prepareDiagnosticsMap(bes);
					dgnstsMap.forEach((v, k) => {
						dgnstsColl.set(vscode.Uri.file(k), v);
					});
					vscode.window.showErrorMessage(`Found ${bes.length} build error${bes.length === 1 ? '' : 's'}!`, { modal: true });
					context.subscriptions.push(dgnstsColl);
				}
				res();
			})
				.catch(err => {
					if ((err as any).code === 'ENOENT') {
						vscode.window.showErrorMessage(
							`Could not find the binary for stackrunner_server!` +
							` Please add or update "stackrunner.serverBinary" in your settings.`,
							{ modal: true });
					}
					res();
				});
		}

	});
};

export function runStackRunnerWith(textDocument: vscode.TextDocument, context: vscode.ExtensionContext) {
	// Display a message box to the user
	vscode.window.showInformationMessage('Running stack runner now');
	const rootPath = vscode.workspace.getWorkspaceFolder(textDocument.uri);
	const bin = vscode.workspace.getConfiguration('stackrunner').get('serverBinary');
	const [prom, sp] = runStackRunner(`${bin}`, rootPath ? rootPath.uri.fsPath : '');
	if (lastSp) {
		lastSp.kill();
		dgnstsColl.clear();
	}
	lastSp = sp;
	const po = <vscode.ProgressOptions>{
		location: vscode.ProgressLocation.Window,
		title: "Stack Runner Execution",
	};
	const thenable = handlePromise(prom, context) as Thenable<void>;
	vscode.window.withProgress(po, ((progress: vscode.Progress<undefined>, token: vscode.CancellationToken) => thenable) as any);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	const msg = 'Thank you for installing Stack Runner';
	console.log(msg);
	vscode.window.showInformationMessage(msg);

	setupConfigurations();

	vscode.workspace.onDidChangeConfiguration(_ => {
		setupConfigurations();
	});

	if (!!vscode.window.activeTextEditor) {
		conditionalStackRunner(false)(vscode.window.activeTextEditor.document, context);
	}

	vscode.workspace.onDidSaveTextDocument(td => {
		const run = td.uri.fsPath.indexOf('.json') === -1 && runOnSave;
		conditionalStackRunner(run)(td, context);
	});

	vscode.workspace.onDidChangeTextDocument(td => {
		textDocument = td.document;
	});

	vscode.window.onDidChangeActiveTextEditor(te => {
		if (!!te) {
			conditionalStackRunner(false)(te.document, context);
		}
	});

	let sub = vscode.commands.registerCommand('extension.runStackRunner', args => {
		conditionalStackRunner(true)(textDocument, context);
	});

	context.subscriptions.push(sub);
}

// this method is called when your extension is deactivated
export function deactivate() { }
