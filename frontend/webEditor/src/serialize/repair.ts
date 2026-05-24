import { ActionDispatcher, CommandExecutionContext, ILogger, TYPES } from "sprotty";
import { FileData, LoadJsonCommand } from "./loadJson";
import { CURRENT_VERSION, SavedDiagram } from "./SavedDiagram";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";
import { SETTINGS } from "../settings/Settings";
import { FileName } from "../fileName/fileName";
import { DfdApiClient } from "../dfdApiClient/dfdApiClient";
import { inject } from "inversify";
import { EditorModeController } from "../settings/editorMode";
import { Action, getBasicType, SModelRoot } from "sprotty-protocol";
import { ConstraintRegistry } from "../constraint/constraintRegistry";
import { LoadingIndicator } from "../loadingIndicator/loadingIndicator";
import { DfdNodeImpl } from "../diagram/nodes/common";
import { DfdPortImpl } from "../diagram/ports/common";

export type RepairType = "sat" | "smt" | "ilp";

export interface RepairAction extends Action {
    kind: typeof RepairAction.KIND;
    repairType: RepairType;
}

export namespace RepairAction {
    export const KIND = "repair";

    export function create(repairType: RepairType): RepairAction {
        return {
            kind: KIND,
            repairType,
        };
    }
}
export class RepairCommand extends LoadJsonCommand {
    static readonly KIND = RepairAction.KIND;
    mitigationInfo: string = "";

    constructor(
        @inject(TYPES.Action) private readonly action: RepairAction,
        @inject(TYPES.ILogger) logger: ILogger,
        @inject(LabelTypeRegistry) labelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) constraintRegistry: ConstraintRegistry,
        @inject(SETTINGS.Mode) editorModeController: EditorModeController,
        @inject(FileName) fileName: FileName,
        @inject(DfdApiClient) private readonly dfdApiClient: DfdApiClient,
        @inject(TYPES.IActionDispatcher) actionDispatcher: ActionDispatcher,
        @inject(LoadingIndicator) loadingIndicator: LoadingIndicator,
    ) {
        super(
            logger,
            labelTypeRegistry,
            constraintRegistry,
            editorModeController,
            actionDispatcher,
            fileName,
            loadingIndicator,
        );
    }

    protected async getFile(context: CommandExecutionContext): Promise<FileData<SavedDiagram> | undefined> {
        const savedDiagram = {
            model: context.modelFactory.createSchema(context.root),
            labelTypes: this.labelTypeRegistry.getLabelTypes(),
            constraints: this.constraintRegistry.getConstraintList(),
            mode: this.editorModeController.get(),
            version: CURRENT_VERSION,
        };

        const serverResponse = await this.dfdApiClient.requestDiagram(
            JSON.stringify(savedDiagram),
            "repair/" + this.action.repairType,
        );

        this.mitigationInfo = serverResponse?.mitigation || "";

        return serverResponse;
    }

    public preprocessModelSchema(modelSchema: SModelRoot): SModelRoot {
        this.annotateMititgation(modelSchema);

        return super.preprocessModelSchema(modelSchema);
    }

    private annotateMititgation(modelSchema: SModelRoot) {
        const nodes = (modelSchema.children ?? []).filter(
            (node) => getBasicType(node) === "node",
        ) as unknown as DfdNodeImpl[];
        const portMessageMap = this.getPortMessageMap(this.mitigationInfo);

        nodes.forEach((node) => {
            node.ports.forEach((rawPort) => {
                const port = rawPort as unknown as DfdPortImpl;

                if (portMessageMap.has(port.id)) {
                    port.customCssStyle = {
                        ...port.customCssStyle,
                        "--port-color": "#ff9800",
                        "--port-border": "#ff9800",
                    };
                }
            });
        });
    }

    private getPortMessageMap(mitigationInfo: string): Map<string, string> {
        const map = new Map<string, string>();

        mitigationInfo.split(";").forEach((entry) => {
            const [key, value] = entry.split(":");

            if (key && value !== undefined) {
                map.set(key, value);
            }
        });

        return map;
    }
}
