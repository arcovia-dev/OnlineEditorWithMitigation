import { generateRandomSprottyId } from "../utils/idGenerator";
import { LabelTypeAndValue, MitigationOption, MitigationType } from "./Mitigation";

export class MitigationRegistry {
    private mitigations: MitigationOption[] = [];
    private updateCallbacks: (() => void)[] = [];

    public registerMitigation(
        type: MitigationType,
        typeOfLabel: string,
        labels: LabelTypeAndValue[],
        forConstraint: string,
    ): MitigationOption {
        const mitigation: MitigationOption = {
            id: generateRandomSprottyId(),
            type,
            typeOfLabel,
            labels,
            forConstraint,
        };

        this.mitigations.push(mitigation);
        this.mitigationChanged();

        return mitigation;
    }

    public registerDefaultMitigation(): MitigationOption {
        return this.registerMitigation(MitigationType.NodeLabel, "Node", [], "");
    }

    public unregisterMitigation(id: string): void {
        this.mitigations = this.mitigations.filter((mitigation) => mitigation.id !== id);
        this.mitigationChanged();
    }

    public updateMitigationType(id: string, type: MitigationType): void {
        const mitigation = this.getMitigationOrThrow(id);
        mitigation.type = type;
        this.mitigationChanged();
    }
    public updateMitigationLabels(id: string, type: MitigationType): void {
        const mitigation = this.getMitigationOrThrow(id);
        mitigation.type = type;
        this.mitigationChanged();
    }

    public updateMitigationTypeOfLabel(id: string, typeOfLabel: string): void {
        const mitigation = this.getMitigationOrThrow(id);
        mitigation.typeOfLabel = typeOfLabel;
        this.mitigationChanged();
    }

    public updateMitigationForConstraint(id: string, forConstraint: string): void {
        const mitigation = this.getMitigationOrThrow(id);
        mitigation.forConstraint = forConstraint;
        this.mitigationChanged();
    }

    public updateMitigation(id: string, update: Partial<Omit<MitigationOption, "id">>): void {
        const mitigation = this.getMitigationOrThrow(id);

        Object.assign(mitigation, update);

        this.mitigationChanged();
    }

    public setMitigations(mitigations: MitigationOption[]): void {
        this.mitigations = mitigations;
        this.mitigationChanged();
    }

    public getMitigations(): MitigationOption[] {
        return this.mitigations;
    }

    public clearMitigations(): void {
        this.mitigations = [];
        this.mitigationChanged();
    }

    public mitigationChanged(): void {
        this.updateCallbacks.forEach((cb) => cb());
    }

    public onUpdate(callback: () => void): void {
        this.updateCallbacks.push(callback);
    }

    private getMitigationOrThrow(id: string): MitigationOption {
        const mitigation = this.mitigations.find((mitigation) => mitigation.id === id);

        if (!mitigation) {
            throw new Error(`No mitigation with id ${id} found`);
        }

        return mitigation;
    }
}
