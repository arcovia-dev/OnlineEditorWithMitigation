export interface MitigationOption {
    id: string;
    type: MitigationType;
    typeOfLabel: string;
    labels: LabelTypeAndValue[];
    forConstraint: string;
}

export interface LabelTypeAndValue {
    labelType: string;
    label: string;
}

export enum MitigationType {
    NodeLabel = "Add Label",
    DeleteNodeLabel = "Delete Label",
    AddNode = "Add Node with Label",
    DeleteNode = "Delete Node with Label",
    DeleteFlow = "Delete Flow with Label",
    AddSink = "AddSink",
}
