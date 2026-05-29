import { AccordionUiExtension } from "../accordionUiExtension";
import { UiElementFactory } from "../utils/UiElementFactory";
import { inject } from "inversify";
import { LabelTypeRegistry } from "../labels/LabelTypeRegistry";

import "./MitigationOptions.css";
import { SETTINGS } from "../settings/Settings";
import { EditorModeController } from "../settings/editorMode";
import { Action } from "sprotty-protocol";

import { MitigationRegistry } from "./MitigationRegistry";
import { MitigationOption, MitigationType } from "./Mitigation";
import { ConstraintRegistry } from "../constraint/constraintRegistry";

export class MitigationOptionsUI extends AccordionUiExtension {
    static readonly ID = "mitigation-options";
    private mitigationOptionContainer?: HTMLElement;

    constructor(
        @inject(LabelTypeRegistry) private readonly labelTypeRegistry: LabelTypeRegistry,
        @inject(ConstraintRegistry) private readonly constraintRegistry: ConstraintRegistry,
        @inject(MitigationRegistry) private readonly mitigationRegistry: MitigationRegistry,
        @inject(SETTINGS.Mode) private readonly editorModeController: EditorModeController,
    ) {
        super("left", "down");

        this.labelTypeRegistry.onUpdate(() => this.renderMitigationOptions());
        this.mitigationRegistry.onUpdate(() => this.renderMitigationOptions());
    }

    id(): string {
        return MitigationOptionsUI.ID;
    }

    containerClass(): string {
        return MitigationOptionsUI.ID;
    }

    protected initializeHidableContent(contentElement: HTMLElement): void {
        const addButton = UiElementFactory.buildAddButton("Add option");

        addButton.onclick = () => {
            if (this.editorModeController.isReadOnly()) {
                return;
            }

            this.mitigationRegistry.registerDefaultMitigation();
        };

        this.mitigationOptionContainer = document.createElement("div");
        this.mitigationOptionContainer.classList.add("mitigation-option-container");

        this.renderMitigationOptions();

        contentElement.appendChild(this.mitigationOptionContainer);
        contentElement.appendChild(addButton);
    }

    protected initializeHeaderContent(headerElement: HTMLElement): void {
        headerElement.innerText = "Mitigation Options";
    }

    private renderMitigationOptions(): void {
        if (!this.mitigationOptionContainer) {
            return;
        }

        const width = this.mitigationOptionContainer.scrollWidth;
        const height = this.mitigationOptionContainer.scrollHeight;
        this.mitigationOptionContainer.style.width = `${width}px`;
        this.mitigationOptionContainer.style.height = `${height}px`;

        const fragment = document.createDocumentFragment();

        for (const mitigation of this.mitigationRegistry.getMitigations()) {
            fragment.appendChild(this.createMitigationOptionElement(mitigation));
        }

        this.mitigationOptionContainer.replaceChildren(fragment);
        this.mitigationOptionContainer.style.width = "";
        this.mitigationOptionContainer.style.height = "";
    }

    private createMitigationOptionElement(mitigation: MitigationOption): HTMLElement {
        const row = document.createElement("div");
        row.classList.add("mitigation-option-row");

        const typeDropdown = this.createMitigationTypeDropdown(mitigation);
        const typeOfLabelBoxes = this.createTypeOfLabelCheckboxes(mitigation);
        const labelDropdown = this.createLabelDropdown(mitigation);
        const constraintDropdown = this.createConstraintDropdown(mitigation);

        row.appendChild(typeDropdown);
        row.appendChild(typeOfLabelBoxes);
        row.appendChild(labelDropdown);
        row.append(constraintDropdown);

        return row;
    }

    private createMitigationTypeDropdown(mitigation: MitigationOption): HTMLSelectElement {
        const select = document.createElement("select");
        select.disabled = this.editorModeController.isReadOnly();

        for (const type of Object.values(MitigationType)) {
            const option = document.createElement("option");
            option.value = type;
            option.innerText = type;
            select.appendChild(option);
        }

        select.value = mitigation.type;

        select.onchange = () => {
            this.mitigationRegistry.updateMitigationType(mitigation.id, select.value as MitigationType);
        };

        return select;
    }

    private createConstraintDropdown(mitigation: MitigationOption): HTMLSelectElement {
        const select = document.createElement("select");
        select.disabled = this.editorModeController.isReadOnly();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.innerText = "Select constraint";
        placeholder.disabled = true;
        placeholder.selected = !mitigation.type;
        select.appendChild(placeholder);

        for (const constraint of this.constraintRegistry.getConstraintList()) {
            const option = document.createElement("option");
            option.value = constraint.name;
            option.innerText = constraint.name;
            select.appendChild(option);
        }

        select.value = mitigation.forConstraint;

        select.onchange = () => {
            this.mitigationRegistry.updateMitigationForConstraint(mitigation.id, select.value);
        };

        return select;
    }

    private createTypeOfLabelCheckboxes(mitigation: MitigationOption): HTMLElement {
        const container = document.createElement("div");
        container.classList.add("mitigation-type-of-label-container");

        const nodeCheckbox = this.createTypeOfLabelCheckbox(mitigation, "Node");

        const incomingCheckbox = this.createTypeOfLabelCheckbox(mitigation, "Incoming");

        const outgoingCheckbox = this.createTypeOfLabelCheckbox(mitigation, "Outgoing");

        container.appendChild(nodeCheckbox);
        container.appendChild(incomingCheckbox);
        container.appendChild(outgoingCheckbox);

        return container;
    }

    private createTypeOfLabelCheckbox(mitigation: MitigationOption, typeOfLabel: string): HTMLElement {
        const label = document.createElement("label");
        label.classList.add("mitigation-type-of-label-checkbox");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = mitigation.typeOfLabel === typeOfLabel;
        checkbox.disabled = this.editorModeController.isReadOnly();

        checkbox.onchange = () => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                return;
            }

            this.mitigationRegistry.updateMitigationTypeOfLabel(mitigation.id, typeOfLabel);
        };

        const span = document.createElement("span");
        span.innerText = typeOfLabel;

        label.appendChild(checkbox);
        label.appendChild(span);

        return label;
    }

    private createLabelDropdown(mitigation: MitigationOption): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.classList.add("mitigation-label-dropdown");

        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("mitigation-label-dropdown-button");
        button.disabled = this.editorModeController.isReadOnly();

        const menu = document.createElement("div");
        menu.classList.add("mitigation-label-dropdown-menu");

        const updateButtonText = () => {
            const count = mitigation.labels.length;
            button.innerText = count === 0 ? "Select labels" : `${count} label${count === 1 ? "" : "s"} selected`;
        };

        button.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();

            menu.classList.toggle("open");
        };

        menu.onclick = (event) => {
            event.stopPropagation();
        };

        const selectedValues = new Set(
            mitigation.labels.map((label) => this.toSelectValue(label.labelType, label.label)),
        );

        for (const labelType of this.labelTypeRegistry.getLabelTypes()) {
            const groupLabel = document.createElement("div");
            groupLabel.classList.add("mitigation-label-dropdown-group");
            groupLabel.innerText = labelType.name;
            menu.appendChild(groupLabel);

            for (const value of labelType.values) {
                const item = document.createElement("label");
                item.classList.add("mitigation-label-dropdown-item");

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.value = this.toSelectValue(labelType.name, value.text);
                checkbox.checked = selectedValues.has(checkbox.value);
                checkbox.disabled = this.editorModeController.isReadOnly();

                checkbox.onchange = (event) => {
                    event.stopPropagation();

                    mitigation.labels = Array.from(
                        menu.querySelectorAll<HTMLInputElement>("input[type='checkbox']:checked"),
                    ).map((selectedCheckbox) => {
                        const [labelTypeId, labelId] = selectedCheckbox.value.split(":");

                        return {
                            labelType: labelTypeId,
                            label: labelId,
                        };
                    });

                    updateButtonText();
                };

                const text = document.createElement("span");
                text.innerText = value.text;

                item.appendChild(checkbox);
                item.appendChild(text);
                menu.appendChild(item);
            }
        }

        updateButtonText();

        wrapper.appendChild(button);
        wrapper.appendChild(menu);

        return wrapper;
    }

    private toSelectValue(labelType: string, label: string): string {
        return `${labelType}:${label}`;
    }

    keyUp(): Action[] {
        return [];
    }
}
