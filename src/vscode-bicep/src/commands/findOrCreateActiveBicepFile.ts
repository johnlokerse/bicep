// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  IActionContext,
  IAzureQuickPickItem,
  IAzureUserInput,
  TelemetryProperties,
  DialogResponses,
  UserCancelledError,
} from "@microsoft/vscode-azext-utils";
import * as path from "path";
import * as os from "os";
import * as fse from "fs-extra";
import { TextDocument, Uri, window, workspace } from "vscode";

type TargetFile =
  | "rightClickOrMenu"
  | "activeEditor"
  | "singleInWorkspace"
  | "singleInVisibleEditors"
  | "quickPick"
  | "new";
type Properties = TelemetryProperties & { targetFile: TargetFile };

// Throws user-cancelled on cancel
export async function findOrCreateActiveBicepFile(
  context: IActionContext,
  documentUri: Uri | undefined,
  prompt: string,
  options?: {
    // If true, will ask the user which file to apply the command to, unless there's only one Bicep file available.  If will do this even
    //   if the active editor is a bicep file.
    // This doesn't apply if a URI is passed in to the command.  In other words, it only applies if the user invokes the command
    //   via the command palette or a keyboard shortcut.
    alwaysAskWhenMultipleAvailable?: boolean;
  }
): Promise<Uri> {
  const properties = <Properties>context.telemetry.properties;
  const ui = context.ui;
  const activeEditor = window.activeTextEditor;
  const activeEditorIsBicep = activeEditor?.document?.languageId === "bicep";
  const alwaysAskWhenMultipleAvailable =
    !!options?.alwaysAskWhenMultipleAvailable;

  if (documentUri) {
    // The command specified a specific URI, so act on that (right-click or context menu)
    properties.targetFile = "rightClickOrMenu";
    return documentUri;
  }

  const workspaceBicepFiles = (
    await workspace.findFiles("**/*.bicep", undefined)
  ).filter((f) => !!f.fsPath);
  const visibleBicepFiles = window.visibleTextEditors // The active editor in all editor groups
    .filter((e) => e.document.languageId === "bicep")
    .map((e) => e.document.uri);

  if (!alwaysAskWhenMultipleAvailable && activeEditorIsBicep) {
    properties.targetFile = "activeEditor";
    return activeEditor.document.uri;
  }

  // Create deduped, sorted array of all available Bicep files (in workspace and visible editors)
  const map = new Map<string, Uri>();
  workspaceBicepFiles
    .concat(visibleBicepFiles)
    .forEach((bf) => map.set(bf.fsPath, bf));
  const bicepFilesSorted = Array.from(map.values());
  bicepFilesSorted.sort((a, b) => compareStrings(a.path, b.path));

  if (bicepFilesSorted.length === 1) {
    // Only a single Bicep file in the workspace/visible editors
    properties.targetFile =
      workspaceBicepFiles.length === 1
        ? "singleInWorkspace"
        : "singleInVisibleEditors";
    return bicepFilesSorted[0];
  }

  if (bicepFilesSorted.length === 0) {
    // Ask to create a new Bicep file...
    return await queryCreateBicepFile(ui, properties);
  }

  // We need to ask the user which existing file to use
  properties.targetFile = "quickPick";

  // Show quick pick
  const entries: IAzureQuickPickItem<Uri>[] = [];
  if (activeEditor?.document?.languageId === "bicep") {
    // Add active editor to the top of the list
    addFileQuickPick(entries, activeEditor.document.uri, true);
    // if (bicepFiles.length > 0) {
    //   entries.push({
    //     label: "",
    //     data: Uri.file("."),
    //     kind: QuickPickItemKind.Separator,
    //   });
    // }
  }
  bicepFilesSorted.forEach((u) => addFileQuickPick(entries, u, false));

  const response = await ui.showQuickPick(entries, {
    placeHolder: prompt,
  });
  return response.data;
}

function addFileQuickPick(
  items: IAzureQuickPickItem<Uri>[],
  uri: Uri,
  isActiveEditor: boolean
): void {
  if (items.find((i) => i.data === uri)) {
    return;
  }

  const workspaceRoot: string | undefined =
    workspace.getWorkspaceFolder(uri)?.uri.fsPath;
  const relativePath = workspaceRoot
    ? path.relative(workspaceRoot, uri.fsPath)
    : path.basename(uri.fsPath);

  items.push({
    label: isActiveEditor ? `$(chevron-right) ${relativePath}` : relativePath,
    data: uri,
    alwaysShow: true,
    description: isActiveEditor ? "Active editor" : undefined,
    id: uri.path, // Used for most-recent persistence
  });
}

async function queryCreateBicepFile(
  ui: IAzureUserInput,
  properties: Properties
): Promise<Uri> {
  properties.targetFile = "new";

  await ui.showWarningMessage(
    "Couldn't find any Bicep files in your workspace. Would you like to create a Bicep file?",
    DialogResponses.yes,
    DialogResponses.cancel
  );

  // User said yes (otherwise would have thrown user cancel error)
  const startingFolder: Uri =
    (workspace.workspaceFolders
      ? workspace.workspaceFolders[0].uri
      : undefined) ?? Uri.file(os.homedir());
  const uri: Uri | undefined = await window.showSaveDialog({
    title: "Save new Bicep file",
    defaultUri: Uri.joinPath(startingFolder, "main"),
    filters: { "Bicep files": ["bicep"] },
  });
  if (!uri) {
    throw new UserCancelledError("saveDialog");
  }

  const path = uri.fsPath;
  if (!path) {
    throw new Error(`Can't save file to location ${uri.toString()}`);
  }

  await fse.writeFile(
    path,
    "@description('Location of all resources')\nparam location string = resourceGroup().location\n",
    { encoding: "utf-8" }
  );

  const document: TextDocument = await workspace.openTextDocument(uri);
  await window.showTextDocument(document);

  return uri;
}

function compareStrings(a: string, b: string): number {
  if (a > b) {
    return 1;
  } else if (b > a) {
    return -1;
  } else {
    return 0;
  }
}
